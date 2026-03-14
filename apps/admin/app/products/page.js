'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function ProductsPage() {
  const { data, isLoading, mutate } = useSWR('/api/products', fetcher);
  const products = data?.products || [];

  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      mutate(); // revalidate SWR
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
      setDeleteConfirm(null);
    }
  };

  const handleToggleActive = async (product) => {
    await fetch(`/api/products/${product._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    mutate();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} total</p>
        </div>
        <Link
          href="/products/new"
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          + Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading products…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            {search ? 'No products match your search.' : (
              <>No products yet. <Link href="/products/new" className="text-blue-600 underline">Add your first →</Link></>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 w-12"></th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Product</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Price</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Stock</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Sold</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const img = p.images?.[0]?.secure_url;
                  const stockColor =
                    p.stock === 0 ? 'text-red-600 bg-red-50' :
                    p.stock < 10 ? 'text-amber-700 bg-amber-50' :
                    'text-green-700 bg-green-50';

                  return (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      {/* Image */}
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 relative">
                          {img ? (
                            <Image src={img} alt={p.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        {p.isFeatured && (
                          <span className="text-[10px] text-amber-600 font-semibold">★ Featured</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-gray-500">{p.category}</td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">৳{p.price.toLocaleString()}</div>
                        {p.comparePrice && (
                          <div className="text-xs text-gray-400 line-through">৳{p.comparePrice.toLocaleString()}</div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stockColor}`}>
                          {p.stock}
                        </span>
                      </td>

                      {/* Status toggle */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                            p.isActive
                              ? 'text-green-700 bg-green-50 hover:bg-green-100'
                              : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {p.isActive ? 'Active' : 'Hidden'}
                        </button>
                      </td>

                      {/* Sold */}
                      <td className="py-3 px-4 text-gray-500">{p.sold || 0}</td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${p._id}`}
                            className="text-xs px-2.5 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Edit
                          </Link>

                          {deleteConfirm === p._id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(p._id)}
                                disabled={deleting === p._id}
                                className="text-xs px-2.5 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                {deleting === p._id ? '…' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs px-2.5 py-1 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(p._id)}
                              className="text-xs px-2.5 py-1 border border-red-200 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
