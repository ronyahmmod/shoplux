import { NextResponse } from "next/server";
import { connectDB } from "@repo/lib/utils/db";
import { Order } from "@repo/lib/models/Order";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
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
            note: `IPN: Payment confirmed. Val ID: ${val_id}`,
          },
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("IPN error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
