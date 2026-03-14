import { NextResponse } from "next/server";
import { connectDB } from "@repo/lib/utils/db";
import { Product } from "@repo/lib/models/Product";
import { productSchema } from "@repo/lib/validators";
import { requireAdmin, withErrorHandler } from "@repo/lib/middleware/auth";
import { authOptions } from "../auth/[...nextauth]/route";

// GET /api/products — all products (admin sees inactive too)
export const GET = withErrorHandler(async (request) => {
  const guard = await requireAdmin(request, authOptions);
  if (guard) return guard;

  await connectDB();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
  const search = searchParams.get("search");

  const query = {};
  if (search) query.$text = { $search: search };

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return NextResponse.json({
    products,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// POST /api/products — create
export const POST = withErrorHandler(async (request) => {
  const guard = await requireAdmin(request, authOptions);
  if (guard) return guard;

  const body = await request.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await connectDB();

  // Auto-generate unique slug
  const baseSlug = body.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  let slug = baseSlug;
  let count = 1;
  while (await Product.exists({ slug })) {
    slug = `${baseSlug}-${count++}`;
  }

  const product = await Product.create({ ...body, slug });
  return NextResponse.json({ product }, { status: 201 });
});
