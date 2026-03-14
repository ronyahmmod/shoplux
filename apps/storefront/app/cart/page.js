'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/cart/CartIcon';

export default function CartPage() {
  const { cart, removeFromCart, updateQty, subtotal, clearCart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
        <p className="text-gray-500 mb-8">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/products" className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold">
          Browse Products
        </Link>
      </div>
    );
  }

  const shippingCost = subtotal >= 1000 ? 0 : 60;
  const total = subtotal + shippingCost;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Shopping Cart <span className="text-gray-400 font-normal text-xl">({cart.length})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
        {/* Items */}
        <div className="space-y-0 divide-y divide-gray-100">
          {cart.map((item) => (
            <div key={`${item._id}-${item.variant}`} className="flex gap-4 py-5">
              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.slug}`} className="font-semibold text-gray-900 hover:text-gray-600 transition-colors block truncate">
                  {item.name}
                </Link>
                {item.variant && <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>}
                <p className="font-semibold text-gray-900 mt-1">৳{item.price.toLocaleString()}</p>

                <div className="flex items-center gap-4 mt-2">
                  {/* Qty stepper */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQty(item._id, item.variant, item.qty - 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                    >−</button>
                    <span className="w-9 text-center text-sm font-medium">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item._id, item.variant, item.qty + 1)}
                      disabled={item.qty >= item.stock}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30"
                    >+</button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item._id, item.variant)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors underline"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Line total */}
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900">৳{(item.price * item.qty).toLocaleString()}</p>
              </div>
            </div>
          ))}

          <div className="flex justify-between pt-4 text-sm">
            <Link href="/products" className="text-gray-400 hover:text-gray-700 underline transition-colors">
              ← Continue Shopping
            </Link>
            <button onClick={clearCart} className="text-gray-400 hover:text-red-500 underline transition-colors">
              Clear cart
            </button>
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sticky top-20">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Order Summary</h2>

          <div className="space-y-2.5 mb-5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="text-gray-900">৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className={shippingCost === 0 ? 'text-green-600 font-medium' : 'text-gray-900'}>
                {shippingCost === 0 ? 'Free' : `৳${shippingCost}`}
              </span>
            </div>
            {subtotal < 1000 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Add ৳{(1000 - subtotal).toLocaleString()} more for free shipping
              </p>
            )}
          </div>

          <div className="flex justify-between font-bold text-gray-900 text-lg pt-4 border-t border-gray-200 mb-5">
            <span>Total</span>
            <span>৳{total.toLocaleString()}</span>
          </div>

          <Link
            href="/checkout"
            className="block w-full text-center bg-gray-900 text-white py-3.5 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            Proceed to Checkout →
          </Link>
        </div>
      </div>
    </div>
  );
}
