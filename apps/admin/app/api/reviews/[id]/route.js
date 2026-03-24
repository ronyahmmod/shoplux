import { NextResponse } from "next/server";
import { connectDB } from "@repo/lib/utils/db";
import { Review } from "@repo/lib/models/Review";
import { requireAdmin, withErrorHandler } from "@repo/lib/middleware/auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export const PATCH = withErrorHandler(async (request, { params }) => {
  const guard = await requireAdmin(request, authOptions);
  if (guard) return guard;
  const body = await request.json();
  await connectDB();
  const review = await Review.findByIdAndUpdate(
    params.id,
    { approved: body.approved },
    { new: true },
  );
  return NextResponse.json({ review });
});

export const DELETE = withErrorHandler(async (request, { params }) => {
  const guard = await requireAdmin(request, authOptions);
  if (guard) return guard;
  await connectDB();
  await Review.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
});
