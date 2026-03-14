'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const inputCls = "w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900";

export default function OrderStatusUpdater({ orderId, currentStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleUpdate = async () => {
    if (status === currentStatus && !note) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      if (!res.ok) throw new Error('Update failed');
      setDone(true);
      setNote('');
      setTimeout(() => { setDone(false); router.refresh(); }, 1500);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Tracking number: BD1234"
          rows={3}
          className={inputCls + ' resize-none'}
        />
      </div>
      <button
        onClick={handleUpdate}
        disabled={saving || done}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          done
            ? 'bg-green-600 text-white'
            : 'bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50'
        }`}
      >
        {done ? '✓ Updated' : saving ? 'Saving…' : 'Update Status'}
      </button>
    </div>
  );
}
