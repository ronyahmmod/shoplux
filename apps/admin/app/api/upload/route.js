import { NextResponse } from 'next/server';
import { uploadImage } from '@repo/lib/utils/cloudinary';
import { requireAdmin, withErrorHandler } from '@repo/lib/middleware/auth';
import { authOptions } from '../auth/[...nextauth]/route';

export const POST = withErrorHandler(async (request) => {
  const guard = await requireAdmin(request, authOptions);
  if (guard) return guard;

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  // Validate type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
  }

  // Validate size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = await uploadImage(buffer, 'products');

  return NextResponse.json({ image });
});
