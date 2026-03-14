'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartIcon';

const INITIAL_ADDRESS = { name: '', street: '', city: '', state: '', zip: '', country: 'Bangladesh', phone: '' };

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { cart, subtotal, clearCart } = useCart();

  const [address, setAddress] = useState(INITIAL_ADDRESS);
  const [coupon, setCoupon] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const shippingCost = subtotal >= 1000 ? 0 : 60;
  const discount = couponResult?.discount || 0;
  const total = subtotal + shippingCost - discount;

  const validateCoupon = async () => {
    if (!coupon.trim()) return;
    const res = await fetch(`/api/coupons/validate?code=${coupon}&subtotal=${subtotal}`);
    const data = await res.json();
    setCouponResult(res.ok ? data : { error: data.error });
  };

  const handlePlaceOrder = async () => {
    if (!session) { router.push('/auth/login?callbackUrl=/checkout'); return; }
    setPlacing(true); setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({ product: i._id, quantity: i.qty, variant: i.variant })),
          shippingAddress: address,
          couponCode: couponResult?.valid ? coupon : undefined,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');
      clearCart();
      router.push(`/orders?success=1`);
    } catch (err) { setError(err.message); }
    finally { setPlacing(false); }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-4xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
        <Link href="/products" className="inline-block bg-gray-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  const addressFields = [
    { key: 'name', label: 'Full Name', full: true },
    { key: 'phone', label: 'Phone Number', full: true },
    { key: 'street', label: 'Street Address', full: true },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State / District' },
    { key: 'zip', label: 'ZIP / Postal Code' },
    { key: 'country', label: 'Country' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-10">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
        {/* Left — address + payment */}
        <div className="space-y-8">

          {/* Sign-in prompt */}
          {!session && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-xl px-4 py-3">
              <Link href="/auth/login?callbackUrl=/checkout" className="font-semibold underline">Sign in</Link> to autofill your details and track your order.
            </div>
          )}

          {/* Shipping address */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Shipping Address</h2>
            <div className="grid grid-cols-2 gap-4">
              {addressFields.map(({ key, label, full }) => (
                <div key={key} className={full ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{label} *</label>
                  <input
                    className={inputCls}
                    required
                    value={address[key]}
                    onChange={(e) => setAddress((a) => ({ ...a, [key]: e.target.value }))}
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Payment method */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="space-y-3">
              {[
                { id: 'stripe', label: 'Credit / Debit Card (Stripe)', icon: '💳' },
                { id: 'cod', label: 'Cash on Delivery', icon: '💵' },
              ].map(({ id, label, icon }) => (
                <label
                  key={id}
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    paymentMethod === id ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input type="radio" name="payment" value={id} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="accent-gray-900" />
                  <span className="text-xl">{icon}</span>
                  <span className={`text-sm ${paymentMethod === id ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{label}</span>
                </label>
              ))}
            </div>
            {paymentMethod === 'stripe' && (
              <p className="mt-3 text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-2">
                🔒 Card details are entered on Stripe&apos;s secure page. We never store your card information.
              </p>
            )}
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
        </div>

        {/* Right — order summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sticky top-20">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Order Summary</h2>

          {/* Items */}
          <div className="space-y-2 pb-4 mb-4 border-b border-gray-200">
            {cart.map((item) => (
              <div key={`${item._id}-${item.variant}`} className="flex justify-between text-sm gap-2">
                <span className="text-gray-500 flex-1 truncate">
                  {item.name} {item.variant ? `(${item.variant})` : ''} × {item.qty}
                </span>
                <span className="font-medium text-gray-900 shrink-0">৳{(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Coupon Code</label>
            <div className="flex gap-2">
              <input
                className={inputCls + ' flex-1'}
                value={coupon}
                onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponResult(null); }}
                placeholder="SAVE20"
              />
              <button onClick={validateCoupon} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors shrink-0">
                Apply
              </button>
            </div>
            {couponResult?.valid && <p className="text-xs text-green-700 mt-1.5 font-medium">✓ Saving ৳{couponResult.discount.toLocaleString()}</p>}
            {couponResult?.error && <p className="text-xs text-red-600 mt-1.5">{couponResult.error}</p>}
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span className="text-gray-900">৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span>
              <span className={shippingCost === 0 ? 'text-green-600 font-medium' : 'text-gray-900'}>
                {shippingCost === 0 ? 'Free' : `৳${shippingCost}`}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span><span>−৳{discount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between font-bold text-gray-900 text-lg pt-4 border-t border-gray-200 mb-5">
            <span>Total</span><span>৳{total.toLocaleString()}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
          >
            {placing ? 'Placing order…' : `Place Order — ৳${total.toLocaleString()}`}
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-3">By placing an order you agree to our Terms & Conditions</p>
        </div>
      </div>
    </div>
  );
}
