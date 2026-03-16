import { NextResponse } from "next/server";
import { connectDB } from "@repo/lib/utils/db";
import { Coupon } from "@repo/lib/models/Coupon";
import { couponSchema } from "@repo/lib/validators";
import { requireAdmin, withErrorHandler } from "@repo/lib/middleware/auth";
import { authOptions } from "../auth/[...nextauth]/route";

export const GET = withErrorHandler(async (request) => {
  const guard = await requireAdmin(request, authOptions);
  if (guard) return guard;
  await connectDB();
  const coupons = await Coupon.find().sort("-createdAt").lean();
  return NextResponse.json({ coupons });
});

export const POST = withErrorHandler(async (request) => {
  const guard = await requireAdmin(request, authOptions);
  if (guard) return guard;

  const body = await request.json();
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await connectDB();

  const existing = await Coupon.findOne({
    code: parsed.data.code.toUpperCase(),
  });
  if (existing)
    return NextResponse.json(
      { error: "Coupon code already exists" },
      { status: 409 },
    );

  const coupon = await Coupon.create(parsed.data);
  return NextResponse.json({ coupon }, { status: 201 });
});
