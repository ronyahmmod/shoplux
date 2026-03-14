import { connectDB } from '@repo/lib/utils/db';
import { Coupon } from '@repo/lib/models/Coupon';
import CreateCouponForm from '@/components/coupons/CreateCouponForm';

export const metadata = { title: 'Coupons' };

export default async function CouponsPage() {
  await connectDB();
  const coupons = await Coupon.find().sort('-createdAt').lean();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Coupons</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Code', 'Type', 'Value', 'Uses', 'Expires', 'Status'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((c) => {
                  const expired = c.expiresAt && new Date() > new Date(c.expiresAt);
                  const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
                  const isValid = c.isActive && !expired && !exhausted;
                  return (
                    <tr key={c._id.toString()} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-gray-900 tracking-wider text-sm">{c.code}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 capitalize">{c.type}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {c.type === 'percentage' ? `${c.value}%` : `৳${c.value}`}
                        {c.minOrderAmount > 0 && (
                          <div className="text-xs text-gray-400 font-normal">min ৳{c.minOrderAmount}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{c.usedCount}{c.maxUses !== null ? ` / ${c.maxUses}` : ''}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {isValid ? 'Active' : expired ? 'Expired' : exhausted ? 'Exhausted' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {coupons.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">No coupons yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create form */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">Create Coupon</h2>
          <CreateCouponForm />
        </div>
      </div>
    </div>
  );
}
