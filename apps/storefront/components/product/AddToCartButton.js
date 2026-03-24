"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/components/cart/CartIcon";

export default function AddToCartButton({ product }) {
  const { data: session } = useSession();
  const { addToCart, cart } = useCart();
  const [selectedVariants, setSelectedVariants] = useState({});
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const [wishing, setWishing] = useState(false);

  const cartItem = cart.find((i) => i._id === product._id.toString());
  const isDisabled = product.stock === 0;

  const handleAdd = () => {
    if (isDisabled) return;
    const variantStr = Object.entries(selectedVariants)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    addToCart({
      _id: product._id.toString(),
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.secure_url,
      slug: product.slug,
      stock: product.stock,
      variant: variantStr || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = async () => {
    if (!session) return;
    setWishing(true);
    try {
      const res = await fetch(`/api/wishlist`, {
        method: wished ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id.toString() }),
      });
      if (res.ok) setWished(!wished);
    } finally {
      setWishing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Variants */}
      {product.variants?.map((variant) => (
        <div key={variant.name}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-600">
            {variant.name}
          </p>
          <div className="flex flex-wrap gap-2">
            {variant.options.map((opt) => {
              const selected = selectedVariants[variant.name] === opt;
              return (
                <button
                  key={opt}
                  onClick={() =>
                    setSelectedVariants((p) => ({ ...p, [variant.name]: opt }))
                  }
                  className={`px-4 py-1.5 text-sm rounded border transition-all ${
                    selected
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-600"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          disabled={isDisabled}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all ${
            isDisabled
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : added
                ? "bg-green-700 text-white"
                : "bg-gray-900 text-white hover:bg-gray-700"
          }`}
        >
          {isDisabled
            ? "Out of Stock"
            : added
              ? "✓ Added to Cart"
              : "Add to Cart"}
        </button>
        <button
          onClick={handleWishlist}
          disabled={wishing || !session}
          title={
            !session
              ? "Sign in to save"
              : wished
                ? "Saved to wishlist"
                : "Save to wishlist"
          }
          className={`px-4 py-3 rounded-lg border  transition-all text-lg ${wished ? "border-red-300 text-red-500 bg-red-50" : "border-gray-300 text-gray-400 hover:border-red-300 hover:text-red-400"}`}
        >
          {wished ? "❤️" : "♡"}
        </button>
      </div>

      {cartItem && (
        <p className="text-sm text-gray-500">
          {cartItem.qty} already in your cart
        </p>
      )}
    </div>
  );
}
