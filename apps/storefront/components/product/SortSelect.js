"use client";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

export default function SortSelect({ current, category, search }) {
  const router = useRouter();

  const handleChange = (e) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    params.set("sort", e.target.value);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <select
      defaultValue={current || "newest"}
      onChange={handleChange}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
