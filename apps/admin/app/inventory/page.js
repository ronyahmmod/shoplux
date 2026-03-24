"use client";
import { useState } from "react";
import useSWR from "swr";
import Image from "next/image";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function InventoryPage() {
  const { data, isLoading, mutate } = useSWR(
    "/api/products?limit=200",
    fetcher,
  );
  const products = data?.products || [];

  const [updating, setUpdating] = useState(null);
  const [stockInputs, setStockInputs] = useState({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    if (filter === "low") return matchSearch && p.stock > 0 && p.stock <= 10;
    if (filter === "out") return matchSearch && p.stock === 0;
    if (filter === "ok") return matchSearch && p.stock > 10;
    return matchSearch;
  });

  const handleStockUpdate = async (productId) => {
    const newStock = parseInt(stockInputs[productId]);
    if (isNaN(newStock) || newStock < 0) return;
    setUpdating(productId);
    try {
      await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      mutate();
      setStockInputs((prev) => ({ ...prev, [productId]: "" }));
    } finally {
      setUpdating(null);
    }
  };

  const stats = {
    total: products.length,
    outOfStock: products.filter((p) => p.stock === 0).length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
    totalUnits: products.reduce((s, p) => s + p.stock, 0),
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage stock levels</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Products",
            value: stats.total,
            color: "text-gray-900",
          },
          {
            label: "Total Units",
            value: stats.totalUnits,
            color: "text-gray-900",
          },
          {
            label: "Low Stock",
            value: stats.lowStock,
            color: "text-amber-600",
          },
          {
            label: "Out of Stock",
            value: stats.outOfStock,
            color: "text-red-600",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-64"
        />
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          {[
            { key: "all", label: "All" },
            { key: "out", label: "🔴 Out of Stock" },
            { key: "low", label: "🟡 Low Stock" },
            { key: "ok", label: "🟢 In Stock" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${filter === key ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Loading inventory…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 w-12"></th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Price
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Sold
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Stock
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Update
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const img = p.images?.[0]?.secure_url;
                  const stockColor =
                    p.stock === 0
                      ? "text-red-600 bg-red-50"
                      : p.stock <= 10
                        ? "text-amber-600 bg-amber-50"
                        : "text-green-700 bg-green-50";
                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 relative">
                          {img ? (
                            <Image
                              src={img}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              📦
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 text-sm">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {p.category}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        ৳{p.price?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{p.sold || 0}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${stockColor}`}
                        >
                          {p.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="New qty"
                            value={stockInputs[p._id] || ""}
                            onChange={(e) =>
                              setStockInputs((prev) => ({
                                ...prev,
                                [p._id]: e.target.value,
                              }))
                            }
                            className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                          <button
                            onClick={() => handleStockUpdate(p._id)}
                            disabled={!stockInputs[p._id] || updating === p._id}
                            className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
                          >
                            {updating === p._id ? "…" : "Update"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-gray-400 text-sm"
                    >
                      No products match
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
