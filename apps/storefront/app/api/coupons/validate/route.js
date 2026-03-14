import { NextResponse } from 'next/server';
import { connectDB } from '@repo/lib/utils/db';
import { Coupon } from '@repo/lib/models/Coupon';
import { withErrorHandler } from '@repo/lib/middleware/auth';

export const GET = withErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.toUpperCase();
  const subtotal = parseFloat(searchParams.get('subtotal') || '0');

  if (!code) return NextResponse.json({ error: 'No coupon code provided' }, { status: 400 });

  await connectDB();
  const coupon = await Coupon.findOne({ code });
  if (!coupon) return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });

  const validity = coupon.isValid();
  if (!validity.valid) return NextResponse.json({ error: validity.message }, { status: 400 });

  if (subtotal < coupon.minOrderAmount) {
    return NextResponse.json(
      { error: `Minimum order of ৳${coupon.minOrderAmount.toLocaleString()} required for this coupon` },
      { status: 400 }
    );
  }

  const discount =
    coupon.type === 'percentage'
      ? Math.round((subtotal * coupon.value) / 100)
      : Math.min(coupon.value, subtotal);

  return NextResponse.json({
    valid: true,
    discount,
    type: coupon.type,
    value: coupon.value,
    message: `${coupon.type === 'percentage' ? `${coupon.value}% off` : `৳${coupon.value} off`} applied`,
  });
});
