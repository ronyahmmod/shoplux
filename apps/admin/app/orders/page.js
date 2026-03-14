import Link from 'next/link';
import { connectDB } from '@repo/lib/utils/db';
import { Order } from '@repo/lib/models/Order';

export const metadata = { title: 'Orders' };

const statusColors = {
  pending:    'bg-amber-50 text-amber-700',
  confirmed:  'bg-blue-50 text-blue-700',
  processing: 'bg-blue-50 text-blue-700',
  shipped:    'bg-purple-50 text-purple-700',
  delivered:  'bg-green-50 text-green-700',
  cancelled:  'bg-red-50 text-red-700',
  refunded:   'bg-red-50 text-red-700',
};

export default async function OrdersPage() {
  await connectDB();
  const orders = await Order.find().sort('-createdAt').populate('user', 'name email').lean();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">{orders.length} total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Order', 'Customer', 'Items', 'Total', 'Status', 'Payment', 'Date', ''].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o._id.toString()} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{o.orderNumber}</td>
                  <td className="py-3 px-4">
                    <div className="text-gray-900 font-medium">{o.user?.name || 'Guest'}</div>
                    <div className="text-xs text-gray-400">{o.user?.email}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{o.items.length}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">৳{o.total.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusColors[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${o.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/orders/${o._id}`} className="text-xs px-2.5 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
