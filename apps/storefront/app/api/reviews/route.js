import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@repo/lib/utils/db';
import { Review } from '@repo/lib/models/Review';
import { Order } from '@repo/lib/models/Order';
import { reviewSchema } from '@repo/lib/validators';
import { withErrorHandler, requireAuth } from '@repo/lib/middleware/auth';
import { authOptions } from '../auth/[...nextauth]/route';

// POST /api/reviews
export const POST = withErrorHandler(async (request) => {
  const guard = await requireAuth(request, authOptions);
  if (guard) return guard;

  const session = await getServerSession(authOptions);
  const body = await request.json();

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();

  const { productId, rating, title, comment } = parsed.data;

  // Check if verified purchase
  const purchasedOrder = await Order.findOne({
    user: session.user.id,
    'items.product': productId,
    status: 'delivered',
  });

  const review = await Review.create({
    product: productId,
    user: session.user.id,
    rating,
    title,
    comment,
    isVerifiedPurchase: !!purchasedOrder,
  });

  await review.populate('user', 'name image');
  return NextResponse.json({ review }, { status: 201 });
});
