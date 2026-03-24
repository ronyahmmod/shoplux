"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function ReviewSection({ productId, initialReviews = [] }) {
  const { data: session } = useSession();
  const { data, mutate } = useSWR(
    `/api/reviews?productId=${productId}`,
    fetcher,
    { fallbackData: { reviews: initialReviews } },
  );
  const reviews = data?.reviews || [];
  console.log(data);

  const [form, setForm] = useState({ rating: 5, title: "", comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [liking, setLiking] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      setError("Please sign in to leave a review");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, ...form }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error?.formErrors?.[0] || data.error || "Failed to submit",
        );
      setSuccess(true);
      setForm({ rating: 5, title: "", comment: "" });
      mutate();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (reviewId, type) => {
    if (!session) return;
    setLiking(reviewId);
    try {
      await fetch(`/api/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      mutate();
    } finally {
      setLiking(null);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <section className="mt-20 pt-12 border-t border-gray-200">
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Customer Reviews
          {reviews.length > 0 && (
            <span className="ml-3 text-lg font-normal text-gray-400">
              ({reviews.length})
            </span>
          )}
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {avgRating}
            </span>
            <div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={`text-lg ${s <= Math.round(avgRating) ? "text-amber-400" : "text-gray-200"}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400">out of 5</p>
            </div>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-gray-400 mb-10">
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div className="space-y-5 mb-12">
          {reviews.map((r) => (
            <div
              key={r._id}
              className="bg-white border border-gray-200 rounded-2xl p-5"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                    {(r.user?.name || "A")[0].toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">
                    {r.user?.name || "Anonymous"}
                  </span>
                  {r.isVerifiedPurchase && (
                    <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                      ✓ Verified Purchase
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`text-sm ${s <= r.rating ? "text-amber-400" : "text-gray-200"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              {r.title && (
                <p className="font-semibold text-gray-900 text-sm mb-1">
                  {r.title}
                </p>
              )}
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                {r.comment}
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">Helpful?</span>
                <button
                  onClick={() => handleLike(r._id, "like")}
                  disabled={!session || liking === r._id}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition-colors disabled:opacity-40"
                >
                  <span>👍</span>
                  <span>{r.likes || 0}</span>
                </button>
                <button
                  onClick={() => handleLike(r._id, "dislike")}
                  disabled={!session || liking === r._id}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors disabled:opacity-40"
                >
                  <span>👎</span>
                  <span>{r.dislikes || 0}</span>
                </button>
                {!session && (
                  <span className="text-xs text-gray-400 italic">
                    Sign in to vote
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">
          Write a Review
        </h3>
        {!session ? (
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Have this product?
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Sign in to share your experience
              </p>
            </div>
            <a
              href="/auth/login"
              className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
            >
              Sign in to Review
            </a>
          </div>
        ) : success ? (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-gray-900">Review submitted!</p>
            <p className="text-sm text-gray-400 mt-1">
              It will appear after approval.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-4 text-sm text-gray-500 underline"
            >
              Write another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Rating *
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: s }))}
                    className={`text-2xl transition-colors ${s <= form.rating ? "text-amber-400" : "text-gray-300 hover:text-amber-300"}`}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500 self-center">
                  {
                    ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][
                      form.rating
                    ]
                  }
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Summarize your experience"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Review *
              </label>
              <textarea
                required
                value={form.comment}
                onChange={(e) =>
                  setForm((f) => ({ ...f, comment: e.target.value }))
                }
                placeholder="Share your experience with this product…"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-gray-900 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
