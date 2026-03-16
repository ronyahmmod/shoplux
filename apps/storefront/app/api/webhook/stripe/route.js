import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@repo/lib/utils/db";
import { Order } from "@repo/lib/models/Order";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Must disable body parsing for Stripe signature verification
// export const config = { api: { bodyParser: false } };
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object;
      await Order.findOneAndUpdate(
        { paymentId: intent.id },
        {
          paymentStatus: "paid",
          status: "confirmed",
          $push: {
            statusHistory: {
              status: "confirmed",
              note: "Payment received via Stripe",
            },
          },
        },
      );
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      await Order.findOneAndUpdate(
        { paymentId: intent.id },
        {
          paymentStatus: "unpaid",
          status: "cancelled",
          $push: {
            statusHistory: { status: "cancelled", note: "Payment failed" },
          },
        },
      );
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;
      await Order.findOneAndUpdate(
        { paymentId: charge.payment_intent },
        {
          paymentStatus: "refunded",
          status: "refunded",
          $push: {
            statusHistory: {
              status: "refunded",
              note: "Refund processed via Stripe",
            },
          },
        },
      );
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
