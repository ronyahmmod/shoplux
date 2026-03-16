import { NextResponse } from "next/server";
import { connectDB } from "@repo/lib/utils/db";
import { Order } from "@repo/lib/models/Order";

export async function POST(request) {
  const body = await request.formData();
  const tran_id = body.get("tran_id");

  await connectDB();
  await Order.findByIdAndUpdate(tran_id, {
    status: "cancelled",
    $push: {
      statusHistory: {
        status: "cancelled",
        note: "Payment failed via SSLCommerz",
      },
    },
  });

  return NextResponse.redirect(
    new URL("/checkout?error=payment_failed", request.url),
  );
}
