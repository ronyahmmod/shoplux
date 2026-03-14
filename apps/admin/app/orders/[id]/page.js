import { notFound } from 'next/navigation';
import { connectDB } from '@repo/lib/utils/db';
import { Order } from '@repo/lib/models/Order';
import OrderStatusUpdater from '@/components/orders/OrderStatusUpdater';

export const metadata = { title: 'Order Detail' };

const statusColors = {
  pending:    'bg-amber-50 text-amber-700',
  confirmed:  'bg-blue-50 text-blue-700',
  processing: 'bg-blue-50 text-blue-700',
  shipped:    'bg-purple-50 text-purple-700',
  delivered:  'bg-green-50 text-green-700',
  cancelled:  'bg-red-50 text-red-700',
  refunded:   'bg-red-50 text-red-700',
};

export default async function OrderDetailPage({ params }) {
  await connectDB();
  const order = await Order.findById(params.id).populate('user', 'name email phone').lean();
  if (!order) notFound();

  const addr = order.shippingAddress || {};

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
            {order.status}
          </span>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Left */}
        <div className="space-y-5">
          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Items ({order.items.length})</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center text-xl">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{item.name}</div>
                    {item.variant && <div className="text-xs text-gray-400">{item.variant}</div>}
                    <div className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} × ৳{item.price?.toLocaleString()}</div>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm shrink-0">
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-sm">
              {[
                ['Subtotal', `৳${order.subtotal?.toLocaleString() || '—'}`],
                ['Shipping', `৳${order.shippingCost?.toLocaleString() || '0'}`],
                order.discount ? ['Discount', `-৳${order.discount.toLocaleString()}`] : null,
              ].filter(Boolean).map(([label, val]) => (
                <div key={label} className="flex justify-between text-gray-500">
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span><span>৳{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Status history */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Status History</h2>
            <div className="space-y-3">
              {(order.statusHistory || []).map((h, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 capitalize ${statusColors[h.status] || 'bg-gray-100 text-gray-600'}`}>
                    {h.status}
                  </span>
                  <div>
                    {h.note && <p className="text-sm text-gray-700">{h.note}</p>}
                    <p className="text-xs text-gray-400">{new Date(h.changedAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {!order.statusHistory?.length && <p className="text-sm text-gray-400">No history yet</p>}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Update Status</h2>
            <OrderStatusUpdater orderId={order._id.toString()} currentStatus={order.status} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Customer</h2>
            <p className="font-medium text-gray-900">{order.user?.name || 'Guest'}</p>
            <p className="text-sm text-gray-400">{order.user?.email}</p>
            {order.user?.phone && <p className="text-sm text-gray-400">{order.user.phone}</p>}
          </div>

          {addr.street && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Shipping Address</h2>
              <address className="not-italic text-sm text-gray-500 leading-relaxed">
                <span className="font-medium text-gray-900">{addr.name}</span><br />
                {addr.phone && <>{addr.phone}<br /></>}
                {addr.street}<br />
                {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zip}<br />
                {addr.country}
              </address>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Method</span><span className="capitalize text-gray-900">{order.paymentMethod || '—'}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Status</span>
                <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.stripePaymentId && (
                <div className="flex justify-between text-gray-500 gap-2">
                  <span className="shrink-0">Payment ID</span>
                  <span className="text-[11px] text-gray-400 font-mono truncate">{order.stripePaymentId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
