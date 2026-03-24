import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@repo/lib/utils/db";
import { Review } from "@repo/lib/models/Review";
import { Order } from "@repo/lib/models/Order";
import { reviewSchema } from "@repo/lib/validators";
import { withErrorHandler, requireAuth } from "@repo/lib/middleware/auth";
import { authOptions } from "../auth/[...nextauth]/route";

export const GET = withErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId)
    return NextResponse.json({ error: "productId required" }, { status: 400 });

  await connectDB();
  const reviews = await Review.find({ product: productId })
    .populate("user", "name")
    .sort("-createdAt")
    .limit(50)
    .lean();

  return NextResponse.json({ reviews });
});

export const POST = withErrorHandler(async (request) => {
  const guard = await requireAuth(request, authOptions);
  if (guard) return guard;

  const session = await getServerSession(authOptions);
  const body = await request.json();

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await connectDB();
  const { productId, rating, title, comment } = parsed.data;

  const existing = await Review.findOne({
    product: productId,
    user: session.user.id,
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already reviewed this product" },
      { status: 409 },
    );
  }

  const purchasedOrder = await Order.findOne({
    user: session.user.id,
    "items.product": productId,
    status: "delivered",
  });

  const review = await Review.create({
    product: productId,
    user: session.user.id,
    rating,
    title,
    comment,
    isVerifiedPurchase: !!purchasedOrder,
    approved: false,
  });

  await review.populate("user", "name");
  return NextResponse.json({ review }, { status: 201 });
});
