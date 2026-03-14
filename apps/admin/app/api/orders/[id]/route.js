import { NextResponse } from 'next/server';
import { connectDB } from '@repo/lib/utils/db';
import { Order } from '@repo/lib/models/Order';
import { requireAdmin, withErrorHandler } from '@repo/lib/middleware/auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export const PATCH = withErrorHandler(async (request, { params }) => {
  const guard = await requireAdmin(request, authOptions);
  if (guard) return guard;

  const { status, note } = await request.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  await connectDB();
  const order = await Order.findByIdAndUpdate(
    params.id,
    {
      status,
      $push: { statusHistory: { status, note: note || undefined, timestamp: new Date() } },
    },
    { new: true }
  );

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json({ order });
});

export const GET = withErrorHandler(async (request, { params }) => {
  const guard = await requireAdmin(request, authOptions);
  if (guard) return guard;

  await connectDB();
  const order = await Order.findById(params.id).populate('user', 'name email').lean();
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json({ order });
});
