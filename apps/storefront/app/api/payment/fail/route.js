import { NextResponse } from "next/server";
import { connectDB } from "@repo/lib/utils/db";
import { Order } from "@repo/lib/models/Order";
import { Product } from "@repo/lib/models/Product";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.formData();
    const tran_id = body.get("tran_id");

    await connectDB();
    const order = await Order.findById(tran_id);

    if (order) {
      await Promise.all(
        order.items.map((item) =>
          Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity, sold: -item.quantity },
          }),
        ),
      );
      await Order.findByIdAndUpdate(tran_id, {
        status: "cancelled",
        $push: {
          statusHistory: {
            status: "cancelled",
            note: "Payment failed via SSLCommerz",
          },
        },
      });
    }

    return NextResponse.redirect(
      new URL("/checkout?payment=failed", request.url),
      { status: 303 },
    );
  } catch (err) {
    console.error("Payment fail error:", err);
    return NextResponse.redirect(new URL("/checkout", request.url), {
      status: 303,
    });
  }
}
