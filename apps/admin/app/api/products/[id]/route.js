import { NextResponse } from 'next/server';
import { connectDB } from '@repo/lib/utils/db';
import { Product } from '@repo/lib/models/Product';
import { deleteImage } from '@repo/lib/utils/cloudinary';
import { requireAdmin, withErrorHandler } from '@repo/lib/middleware/auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// PUT /api/products/[id] — update
export const PUT = withErrorHandler(async (request, { params }) => {
  const guard = await requireAdmin(request, authOptions);
  if (guard) return guard;

  const body = await request.json();
  await connectDB();

  const product = await Product.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  return NextResponse.json({ product });
});

// DELETE /api/products/[id] — delete with Cloudinary cleanup
export const DELETE = withErrorHandler(async (request, { params }) => {
  const guard = await requireAdmin(request, authOptions);
  if (guard) return guard;

  await connectDB();
  const product = await Product.findById(params.id);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // Clean up Cloudinary images
  if (product.images?.length) {
    await Promise.allSettled(product.images.map((img) => deleteImage(img.public_id)));
  }

  await product.deleteOne();
  return NextResponse.json({ success: true });
});
