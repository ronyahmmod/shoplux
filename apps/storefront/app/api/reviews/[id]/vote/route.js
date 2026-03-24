import { NextResponse } from "next/server";
import { connectDB } from "@repo/lib/utils/db";
import { Review } from "@repo/lib/models/Review";
import { requireAuth, withErrorHandler } from "@repo/lib/middleware/auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export const POST = withErrorHandler(async (request, { params }) => {
  const guard = await requireAuth(request, authOptions);
  if (guard) return guard;

  const { type } = await request.json();
  if (!["like", "dislike"].includes(type)) {
    return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
  }

  await connectDB();
  const update =
    type === "like" ? { $inc: { likes: 1 } } : { $inc: { dislikes: 1 } };
  const review = await Review.findByIdAndUpdate(params.id, update, {
    new: true,
  });
  return NextResponse.json({ review });
});
