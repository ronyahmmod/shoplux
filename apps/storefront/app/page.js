import Link from 'next/link';
import Image from 'next/image';
import { connectDB } from '@repo/lib/utils/db';
import { Product } from '@repo/lib/models/Product';

async function getFeaturedProducts() {
  await connectDB();
  return Product.find({ isActive: true, isFeatured: true }).sort('-createdAt').limit(8).lean();
}

async function getCategories() {
  await connectDB();
  return Product.distinct('category', { isActive: true });
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([getFeaturedProducts(), getCategories()]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gray-50 border-b border-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mb-6">
              New Collection
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Crafted for<br />Those Who Know
            </h1>
            <p className="text-lg text-gray-500 mb-8 max-w-md">
              Curated products from makers who care about every detail.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/products" className="bg-gray-900 text-white px-7 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors">
                Shop All Products
              </Link>
              <Link href="/products?featured=true" className="border border-gray-300 text-gray-700 px-7 py-3 rounded-xl font-semibold hover:border-gray-600 transition-colors">
                Featured Picks
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="aspect-[4/5] bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400 font-medium">
              Hero Image
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">Shop by Category</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/products?category=${cat}`}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-full text-gray-600 bg-white hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-baseline mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/products" className="text-sm text-gray-400 hover:text-gray-700 underline transition-colors">
              View all →
            </Link>
          </div>

          {products.length === 0 ? (
            <p className="text-center text-gray-400 py-16">No products yet. Check back soon!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <ProductCard key={product._id.toString()} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ProductCard({ product }) {
  const image = product.images?.[0];
  const isOnSale = product.comparePrice && product.comparePrice > product.price;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {image ? (
          <Image
            src={image.secure_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
        )}
        {isOnSale && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
            Sale
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-500">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">{product.category}</p>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5 line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">৳{product.price.toLocaleString()}</span>
          {isOnSale && (
            <span className="text-xs text-gray-400 line-through">৳{product.comparePrice.toLocaleString()}</span>
          )}
        </div>
        {product.avgRating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-amber-400 text-xs">★</span>
            <span className="text-xs text-gray-400">{product.avgRating} ({product.numReviews})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
