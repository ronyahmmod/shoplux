"use client";
import useSWR from "swr";
import Image from "next/image";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function ReviewsPage() {
  const { data, isLoading, mutate } = useSWR("/api/reviews", fetcher);
  const reviews = data?.reviews || [];

  const handleApprove = async (id, approved) => {
    await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    mutate();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this review?")) return;
    await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    mutate();
  };

  const pending = reviews.filter((r) => !r.approved).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {reviews.length} total
            {pending > 0 && (
              <span className="text-amber-600 font-medium">
                {" "}
                · {pending} pending approval
              </span>
            )}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Loading reviews…
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No reviews yet
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r._id}
              className={`bg-white rounded-xl border p-5 ${!r.approved ? "border-amber-200" : "border-gray-200"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                    {r.product?.images?.[0]?.secure_url ? (
                      <Image
                        src={r.product.images[0].secure_url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-gray-900 text-sm">
                        {r.user?.name || "Anonymous"}
                      </span>
                      {r.isVerifiedPurchase && (
                        <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                          Verified Purchase
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.approved ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                      >
                        {r.approved ? "Published" : "Pending"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      on{" "}
                      <span className="font-medium text-gray-600">
                        {r.product?.name}
                      </span>
                      {" · "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className={`text-sm ${s <= r.rating ? "text-amber-400" : "text-gray-200"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {r.title && (
                      <p className="font-semibold text-gray-900 text-sm mb-1">
                        {r.title}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {r.comment}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>👍 {r.likes || 0} helpful</span>
                      <span>👎 {r.dislikes || 0} not helpful</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {!r.approved ? (
                    <button
                      onClick={() => handleApprove(r._id, true)}
                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(r._id, false)}
                      className="text-xs px-3 py-1.5 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
                    >
                      Unapprove
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r._id)}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
