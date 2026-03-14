import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@repo/lib/utils/db";
import { Product } from "@repo/lib/models/Product";
import SortSelect from "@/components/product/SortSelect";

export const metadata = { title: "Shop All Products" };

const sortMap = {
  newest: "-createdAt",
  "price-asc": "price",
  "price-desc": "-price",
  popular: "-sold",
  rating: "-avgRating",
};

async function getProducts({ category, search, sort, featured }) {
  await connectDB();
  const query = { isActive: true };
  if (category) query.category = category;
  if (featured === "true") query.isFeatured = true;
  if (search) query.$text = { $search: search };
  return Product.find(query)
    .sort(sortMap[sort] || "-createdAt")
    .limit(60)
    .lean();
}

async function getCategories() {
  await connectDB();
  return Product.distinct("category", { isActive: true });
}

export default async function ProductsPage({ searchParams }) {
  const { category, search, sort, featured } = searchParams;
  const [products, categories] = await Promise.all([
    getProducts({ category, search, sort, featured }),
    getCategories(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap justify-between items-baseline gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {category || (featured === "true" ? "Featured" : "All Products")}
          <span className="ml-2 text-lg font-normal text-gray-400">
            ({products.length})
          </span>
        </h1>

        <SortSelect current={sort} category={category} search={search} />
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-8 items-start">
        {/* Sidebar */}
        <aside>
          <div className="sticky top-24">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
              Categories
            </p>
            <div className="space-y-0.5">
              <Link
                href="/products"
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!category ? "bg-gray-900 text-white font-medium" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
              >
                All Products
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/products?category=${encodeURIComponent(cat)}`}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${category === cat ? "bg-gray-900 text-white font-medium" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">😕</p>
            <p className="text-gray-500 mb-4">No products found</p>
            <Link
              href="/products"
              className="text-sm underline text-gray-400 hover:text-gray-700"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => {
              const img = p.images?.[0]?.secure_url;
              const isOnSale = p.comparePrice && p.comparePrice > p.price;
              return (
                <Link
                  key={p._id.toString()}
                  href={`/products/${p.slug}`}
                  className="group block bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {img ? (
                      <Image
                        src={img}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        📦
                      </div>
                    )}
                    {isOnSale && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        Sale
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                      {p.category}
                    </p>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">
                        ৳{p.price.toLocaleString()}
                      </span>
                      {isOnSale && (
                        <span className="text-xs text-gray-400 line-through">
                          ৳{p.comparePrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {p.avgRating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-amber-400 text-xs">★</span>
                        <span className="text-xs text-gray-400">
                          {p.avgRating}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
