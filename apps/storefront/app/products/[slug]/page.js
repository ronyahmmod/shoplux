import { notFound } from 'next/navigation';
import Image from 'next/image';
import { connectDB } from '@repo/lib/utils/db';
import { Product } from '@repo/lib/models/Product';
import { Review } from '@repo/lib/models/Review';
import AddToCartButton from '@/components/product/AddToCartButton';

async function getProduct(slug) {
  await connectDB();
  return Product.findOne({ slug, isActive: true }).lean();
}

async function getReviews(productId) {
  await connectDB();
  return Review.find({ product: productId }).populate('user', 'name').sort('-createdAt').limit(20).lean();
}

export async function generateMetadata({ params }) {
  await connectDB();
  const product = await Product.findOne({ slug: params.slug, isActive: true }).lean();
  if (!product) return { title: 'Product Not Found' };
  const image = product.images?.[0]?.secure_url;
  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.description?.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 200),
      images: image ? [{ url: image, width: 1200, height: 630, alt: product.name }] : [],
    },
    twitter: { card: 'summary_large_image', images: image ? [image] : [] },
  };
}

export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const reviews = await getReviews(product._id);
  const isOnSale = product.comparePrice && product.comparePrice > product.price;
  const discount = isOnSale
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

        {/* Images */}
        <div className="sticky top-24">
          <div className="aspect-square relative rounded-2xl overflow-hidden bg-gray-100">
            {product.images?.[0] ? (
              <Image src={product.images[0].secure_url} alt={product.name} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {product.images.slice(1, 5).map((img, i) => (
                <div key={i} className="aspect-square relative rounded-xl overflow-hidden bg-gray-100 border-2 border-transparent hover:border-gray-400 transition-colors cursor-pointer">
                  <Image src={img.secure_url} alt={`${product.name} ${i + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{product.category}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">{product.name}</h1>

          {/* Rating */}
          {product.avgRating > 0 && (
            <div className="flex items-center gap-2 mb-5">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className={`text-lg ${s <= Math.round(product.avgRating) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                ))}
              </div>
              <span className="text-sm text-gray-500">{product.avgRating} ({product.numReviews} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-gray-900">৳{product.price.toLocaleString()}</span>
            {isOnSale && (
              <>
                <span className="text-xl text-gray-400 line-through">৳{product.comparePrice.toLocaleString()}</span>
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">{discount}% OFF</span>
              </>
            )}
          </div>

          {/* Stock */}
          <p className="text-sm font-medium mb-5">
            {product.stock > 0 ? (
              <span className="text-green-600">✓ In stock ({product.stock} available)</span>
            ) : (
              <span className="text-red-500">✗ Out of stock</span>
            )}
          </p>

          {/* Description */}
          <p className="text-gray-500 leading-relaxed mb-8">{product.description}</p>

          {/* Add to cart */}
          <AddToCartButton product={JSON.parse(JSON.stringify(product))} />

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {product.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-20 pt-12 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-400">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-5">
            {reviews.map((r) => (
              <div key={r._id.toString()} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{r.user?.name || 'Anonymous'}</span>
                    {r.isVerifiedPurchase && (
                      <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                    )}
                  </div>
                  <div className="flex">
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} className={`text-sm ${s <= r.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                </div>
                {r.title && <p className="font-semibold text-gray-900 text-sm mb-1">{r.title}</p>}
                <p className="text-gray-500 text-sm leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
