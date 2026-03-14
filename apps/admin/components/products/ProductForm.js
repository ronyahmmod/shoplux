'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const Field = ({ label, hint, children }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>
    {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
    {children}
  </div>
);

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent";

export default function ProductForm({ product = null }) {
  const router = useRouter();
  const isEdit = !!product;
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    comparePrice: product?.comparePrice || '',
    category: product?.category || '',
    tags: product?.tags?.join(', ') || '',
    stock: product?.stock ?? '',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    metaTitle: product?.metaTitle || '',
    metaDescription: product?.metaDescription || '',
  });
  const [images, setImages] = useState(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true); setError('');
    try {
      const uploaded = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Upload failed');
        uploaded.push((await res.json()).image);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };

  const removeImage = (idx) => setImages((p) => p.filter((_, i) => i !== idx));
  const moveImage = (from, to) => {
    const arr = [...images];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setImages(arr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    const payload = {
      ...form,
      price: parseFloat(form.price),
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
      stock: parseInt(form.stock, 10),
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      images,
    };
    try {
      const res = await fetch(isEdit ? `/api/products/${product._id}` : '/api/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      router.push('/products'); router.refresh();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const discountPct =
    form.comparePrice && form.price && parseFloat(form.comparePrice) > parseFloat(form.price)
      ? Math.round(((parseFloat(form.comparePrice) - parseFloat(form.price)) / parseFloat(form.comparePrice)) * 100)
      : null;

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'New Product'}</h1>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left */}
        <div className="space-y-5">
          {/* Basic info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Basic Information</h2>
            <Field label="Product Name *">
              <input className={inputCls} value={form.name} onChange={set('name')} required placeholder="e.g. Premium Leather Wallet" />
            </Field>
            <Field label="Description *">
              <textarea className={inputCls} value={form.description} onChange={set('description')} required rows={5} placeholder="Describe your product…" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category *">
                <input className={inputCls} value={form.category} onChange={set('category')} required placeholder="e.g. Accessories" />
              </Field>
              <Field label="Tags (comma-separated)">
                <input className={inputCls} value={form.tags} onChange={set('tags')} placeholder="leather, wallet" />
              </Field>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Pricing & Inventory</h2>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Price (৳) *">
                <input className={inputCls} type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required placeholder="0.00" />
              </Field>
              <Field label="Compare Price (৳)">
                <input className={inputCls} type="number" min="0" step="0.01" value={form.comparePrice} onChange={set('comparePrice')} placeholder="Original price" />
              </Field>
              <Field label="Stock *">
                <input className={inputCls} type="number" min="0" value={form.stock} onChange={set('stock')} required placeholder="0" />
              </Field>
            </div>
            {discountPct && (
              <p className="text-xs text-green-600 font-medium mt-1">✓ {discountPct}% discount badge will show</p>
            )}
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">SEO & Social Sharing</h2>
            <p className="text-xs text-gray-400 mb-4">Controls how this product looks when shared on Facebook/Instagram</p>
            <Field label={`Meta Title (${form.metaTitle.length}/60)`}>
              <input className={inputCls} value={form.metaTitle} onChange={set('metaTitle')} maxLength={60} placeholder="Defaults to product name" />
            </Field>
            <Field label={`Meta Description (${form.metaDescription.length}/160)`}>
              <textarea className={inputCls} value={form.metaDescription} onChange={set('metaDescription')} maxLength={160} rows={3} placeholder="Defaults to first 160 chars of description" />
            </Field>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Status</h2>
            {[
              { key: 'isActive', title: 'Active / Visible', sub: 'Show on storefront' },
              { key: 'isFeatured', title: 'Featured', sub: 'Show on homepage' },
            ].map(({ key, title, sub }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer mb-3 last:mb-0">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={set(key)}
                  className="w-4 h-4 rounded accent-gray-900"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800">{title}</div>
                  <div className="text-xs text-gray-400">{sub}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Product Images</h2>

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {images.map((img, idx) => (
                  <div
                    key={img.public_id}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 ${idx === 0 ? 'border-gray-900' : 'border-gray-200'}`}
                  >
                    <Image src={img.secure_url} alt="" fill className="object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Main
                      </span>
                    )}
                    <div className="absolute top-1 right-1 flex gap-1">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(idx, idx - 1)}
                          className="w-5 h-5 bg-black/60 text-white rounded text-[10px] flex items-center justify-center hover:bg-black"
                        >←</button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="w-5 h-5 bg-red-600/80 text-white rounded text-sm flex items-center justify-center hover:bg-red-700 leading-none"
                      >×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : '+ Upload Images'}
            </button>
            <p className="text-xs text-center text-gray-400 mt-2">First image = main. Use ← to reorder.</p>
          </div>
        </div>
      </div>
    </form>
  );
}
