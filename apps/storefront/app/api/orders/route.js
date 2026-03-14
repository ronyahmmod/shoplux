import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@repo/lib/utils/db';
import { Order } from '@repo/lib/models/Order';
import { Product } from '@repo/lib/models/Product';
import { Coupon } from '@repo/lib/models/Coupon';
import { orderSchema } from '@repo/lib/validators';
import { withErrorHandler, requireAuth } from '@repo/lib/middleware/auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET /api/orders — current user's orders
export const GET = withErrorHandler(async (request) => {
  const guard = await requireAuth(request, authOptions);
  if (guard) return guard;

  const session = await getServerSession(authOptions);
  await connectDB();

  const orders = await Order.find({ user: session.user.id })
    .sort('-createdAt')
    .populate('items.product', 'name slug images')
    .lean();

  return NextResponse.json({ orders });
});

// POST /api/orders — place a new order
export const POST = withErrorHandler(async (request) => {
  const guard = await requireAuth(request, authOptions);
  if (guard) return guard;

  const session = await getServerSession(authOptions);
  const body = await request.json();

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();

  const { items, shippingAddress, couponCode, paymentMethod } = parsed.data;

  // Fetch products and validate stock
  const productIds = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });

  if (products.length !== items.length) {
    return NextResponse.json({ error: 'One or more products are unavailable' }, { status: 400 });
  }

  let subtotal = 0;
  const orderItems = items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.product);
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for "${product.name}"`);
    }
    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;
    return {
      product: product._id,
      name: product.name,
      image: product.images[0]?.secure_url,
      price: product.price,
      quantity: item.quantity,
      variant: item.variant,
    };
  });

  // Apply coupon
  let discount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    const validity = coupon.isValid();
    if (!validity.valid) return NextResponse.json({ error: validity.message }, { status: 400 });
    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        { error: `Minimum order amount for this coupon is ${coupon.minOrderAmount}` },
        { status: 400 }
      );
    }
    discount =
      coupon.type === 'percentage'
        ? Math.round((subtotal * coupon.value) / 100)
        : Math.min(coupon.value, subtotal);
    await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
  }

  const shippingCost = subtotal >= 1000 ? 0 : 60; // free shipping over 1000
  const total = subtotal - discount + shippingCost;

  // Create order
  const order = await Order.create({
    user: session.user.id,
    items: orderItems,
    shippingAddress,
    subtotal,
    shippingCost,
    discount,
    total,
    couponCode,
    paymentMethod,
    statusHistory: [{ status: 'pending', note: 'Order placed' }],
  });

  // Decrement stock
  await Promise.all(
    items.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, sold: item.quantity },
      })
    )
  );

  return NextResponse.json({ order }, { status: 201 });
});
