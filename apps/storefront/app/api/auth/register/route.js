import { NextResponse } from 'next/server';
import { connectDB } from '@repo/lib/utils/db';
import { User } from '@repo/lib/models/User';
import { registerSchema } from '@repo/lib/validators';
import { withErrorHandler } from '@repo/lib/middleware/auth';

export const POST = withErrorHandler(async (request) => {
  const body = await request.json();

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  await connectDB();

  const existing = await User.findOne({ email: parsed.data.email });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  const user = await User.create({
    name: parsed.data.name,
    email: parsed.data.email,
    password: parsed.data.password,
    role: 'customer',
  });

  return NextResponse.json({ user: { id: user._id, name: user.name, email: user.email } }, { status: 201 });
});
