import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { connectDB } from "@repo/lib/utils/db";
import { User } from "@repo/lib/models/User";
import { requireAdmin, withErrorHandler } from "@repo/lib/middleware/auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export const POST = withErrorHandler(async (request) => {
  const guard = await requireAdmin(request, authOptions);
  if (guard) return guard;

  const session = await getServerSession(authOptions);
  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Both passwords are required" },
      { status: 400 },
    );
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  await connectDB();
  const user = await User.findById(session.user.id).select("+password");
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 400 },
    );
  }

  user.password = newPassword;
  await user.save();

  return NextResponse.json({ success: true });
});
