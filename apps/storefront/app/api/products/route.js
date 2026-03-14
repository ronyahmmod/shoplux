import { NextResponse } from 'next/server';
import { connectDB } from '@repo/lib/utils/db';
import { Product } from '@repo/lib/models/Product';
import { withErrorHandler } from '@repo/lib/middleware/auth';

// GET /api/products — public, paginated, filterable
export const GET = withErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '12'));
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || '-createdAt';
  const featured = searchParams.get('featured');

  await connectDB();

  const query = { isActive: true };
  if (category) query.category = category;
  if (featured === 'true') query.isFeatured = true;
  if (search) query.$text = { $search: search };

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return NextResponse.json({
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
