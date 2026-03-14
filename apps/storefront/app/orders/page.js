import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@repo/lib/utils/db';
import { Order } from '@repo/lib/models/Order';

export const metadata = { title: 'My Orders' };

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
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login?callbackUrl=/orders');

  await connectDB();
  const orders = await Order.find({ user: session.user.id }).sort('-createdAt').lean();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-gray-500 mb-6">You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="inline-block bg-gray-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id.toString()} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <p className="font-semibold text-gray-900 mb-0.5">{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}{order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 mb-1.5">৳{order.total.toLocaleString()}</p>
                  <div className="flex gap-2 justify-end">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-3 pt-3 border-t border-gray-100 truncate">
                {order.items.map((i) => i.name).join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
