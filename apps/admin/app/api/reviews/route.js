import { NextResponse } from "next/server";
import { connectDB } from "@repo/lib/utils/db";
import { Review } from "@repo/lib/models/Review";
import { requireAdmin, withErrorHandler } from "@repo/lib/middleware/auth";
import { authOptions } from "../auth/[...nextauth]/route";

export const GET = withErrorHandler(async (request) => {
  const guard = await requireAdmin(request, authOptions);
  if (guard) return guard;
  await connectDB();
  const reviews = await Review.find()
    .populate("user", "name email")
    .populate("product", "name images")
    .sort("-createdAt")
    .lean();
  return NextResponse.json({ reviews });
});
