import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@repo/lib/utils/db";
import { User } from "@repo/lib/models/User";
import { requireAuth, withErrorHandler } from "@repo/lib/middleware/auth";
import { authOptions } from "../auth/[...nextauth]/route";

export const POST = withErrorHandler(async (request) => {
  const guard = await requireAuth(request, authOptions);
  if (guard) return guard;
  const session = await getServerSession(authOptions);
  const { productId } = await request.json();
  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    $addToSet: { wishlist: productId },
  });
  return NextResponse.json({ success: true });
});

export const DELETE = withErrorHandler(async (request) => {
  const guard = await requireAuth(request, authOptions);
  if (guard) return guard;
  const session = await getServerSession(authOptions);
  const { productId } = await request.json();
  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    $pull: { wishlist: productId },
  });
  return NextResponse.json({ success: true });
});
