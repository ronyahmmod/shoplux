import { connectDB } from '@repo/lib/utils/db';
import { User } from '@repo/lib/models/User';
import { Order } from '@repo/lib/models/Order';

export const metadata = { title: 'Customers' };

export default async function CustomersPage() {
  await connectDB();
  const [customers, orderStats] = await Promise.all([
    User.find({ role: 'customer' }).sort('-createdAt').lean(),
    Order.aggregate([
      { $group: { _id: '$user', orderCount: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
    ]),
  ]);

  const statsMap = {};
  orderStats.forEach((s) => { statsMap[s._id?.toString()] = s; });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">{customers.length} total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Name', 'Email', 'Provider', 'Orders', 'Total Spent', 'Joined'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => {
                const stats = statsMap[c._id.toString()] || { orderCount: 0, totalSpent: 0 };
                return (
                  <tr key={c._id.toString()} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                          {(c.name || 'G')[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{c.name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{c.email}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                        {c.provider || 'credentials'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{stats.orderCount}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">৳{stats.totalSpent.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No customers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
