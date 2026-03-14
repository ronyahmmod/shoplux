'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent";

export default function CreateCouponForm() {
  const router = useRouter();
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', minOrderAmount: '', maxUses: '', expiresAt: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.toUpperCase().trim(),
          type: form.type,
          value: parseFloat(form.value),
          minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : 0,
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          expiresAt: form.expiresAt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSuccess(`"${data.coupon.code}" created!`);
      setForm({ code: '', type: 'percentage', value: '', minOrderAmount: '', maxUses: '', expiresAt: '' });
      router.refresh();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2.5">✓ {success}</div>}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Coupon Code *</label>
        <input className={inputCls + ' uppercase'} value={form.code} onChange={set('code')} required placeholder="SAVE20" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Type *</label>
          <select className={inputCls} value={form.type} onChange={set('type')}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (৳)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Value *</label>
          <input className={inputCls} type="number" min="0" step="0.01" value={form.value} onChange={set('value')} required placeholder={form.type === 'percentage' ? '20' : '100'} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Min Order (৳)</label>
        <input className={inputCls} type="number" min="0" value={form.minOrderAmount} onChange={set('minOrderAmount')} placeholder="0 = no minimum" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Max Uses</label>
          <input className={inputCls} type="number" min="1" value={form.maxUses} onChange={set('maxUses')} placeholder="Unlimited" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Expires At</label>
          <input className={inputCls} type="date" value={form.expiresAt} onChange={set('expiresAt')} min={new Date().toISOString().split('T')[0]} />
        </div>
      </div>

      <button type="submit" disabled={saving} className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
        {saving ? 'Creating…' : 'Create Coupon'}
      </button>
    </form>
  );
}
