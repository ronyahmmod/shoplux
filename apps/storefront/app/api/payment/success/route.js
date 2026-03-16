import { NextResponse } from "next/server";
import { connectDB } from "@repo/lib/utils/db";
import { Order } from "@repo/lib/models/Order";

export async function POST(request) {
  const body = await request.formData();
  const tran_id = body.get("tran_id");
  const val_id = body.get("val_id");
  const status = body.get("status");

  await connectDB();

  if (status === "VALID" || status === "VALIDATED") {
    await Order.findByIdAndUpdate(tran_id, {
      paymentStatus: "paid",
      status: "confirmed",
      sslcommerzValId: val_id,
      $push: {
        statusHistory: {
          status: "confirmed",
          note: `SSLCommerz payment verified. Val ID: ${val_id}`,
        },
      },
    });
  }

  // Redirect browser to success page
  return NextResponse.redirect(new URL(`/orders?success=1`, request.url));
}
