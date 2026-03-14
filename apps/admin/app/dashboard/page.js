import { connectDB } from '@repo/lib/utils/db';
import { Order } from '@repo/lib/models/Order';
import { Product } from '@repo/lib/models/Product';
import { User } from '@repo/lib/models/User';

export const metadata = { title: 'Dashboard' };

async function getStats() {
  await connectDB();
  const [totalOrders, totalProducts, totalCustomers, revenueAgg, recentOrders] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'customer' }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.find().sort('-createdAt').limit(8).populate('user', 'name email').lean(),
  ]);
  return { totalOrders, totalProducts, totalCustomers, revenue: revenueAgg[0]?.total || 0, recentOrders };
}

const statusColors = {
  pending:    'bg-amber-50 text-amber-700',
  confirmed:  'bg-blue-50 text-blue-700',
  processing: 'bg-blue-50 text-blue-700',
  shipped:    'bg-purple-50 text-purple-700',
  delivered:  'bg-green-50 text-green-700',
  cancelled:  'bg-red-50 text-red-700',
};

export default async function DashboardPage() {
  const { totalOrders, totalProducts, totalCustomers, revenue, recentOrders } = await getStats();

  const stats = [
    { label: 'Total Revenue', value: `৳${revenue.toLocaleString()}`, icon: '💰', color: 'bg-green-50 text-green-700' },
    { label: 'Total Orders', value: totalOrders.toLocaleString(), icon: '📦', color: 'bg-blue-50 text-blue-700' },
    { label: 'Active Products', value: totalProducts.toLocaleString(), icon: '🛍️', color: 'bg-purple-50 text-purple-700' },
    { label: 'Customers', value: totalCustomers.toLocaleString(), icon: '👥', color: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl mb-3 ${color}`}>
              {icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Order', 'Customer', 'Total', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order._id.toString()} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{order.orderNumber}</td>
                  <td className="py-3 px-4 text-gray-500">{order.user?.name || 'Guest'}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">৳{order.total.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
