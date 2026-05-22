/**
 * Full reviews section rendered below the accordions on the PDP.
 * Server component — receives pre-fetched review data as props.
 */

export type ReviewDoc = {
  id: string | number;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  verified: boolean;
  reviewDate?: string | null;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-px leading-none" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-sm ${i < rating ? "text-gold" : "text-cream-200"}`}>
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function ReviewsSection({
  reviews,
  avgRating,
}: {
  reviews: ReviewDoc[];
  avgRating: number;
}) {
  if (reviews.length === 0) return null;

  // Distribution
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <section id="reviews" className="mt-16 scroll-mt-8 max-w-3xl">
      <h2 className="font-display text-3xl text-navy mb-8">Customer Reviews</h2>

      {/* Summary */}
      <div className="flex flex-col sm:flex-row gap-8 mb-10 p-6 bg-cream-100/60 rounded-xl border border-cream-200">
        {/* Overall score */}
        <div className="flex flex-col items-center justify-center sm:w-36 shrink-0 text-center">
          <span className="font-display text-5xl text-navy font-semibold">
            {avgRating.toFixed(1)}
          </span>
          <div className="flex gap-px mt-1">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={`text-lg ${i < Math.round(avgRating) ? "text-gold" : "text-cream-200"}`}
              >
                ★
              </span>
            ))}
          </div>
          <p className="text-xs text-muted mt-1">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </p>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 space-y-2">
          {dist.map(({ star, count }) => {
            const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-8 text-right text-muted shrink-0">{star} ★</span>
                <div className="flex-1 bg-cream-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-muted shrink-0">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-6">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="border border-cream-200 rounded-xl p-5 bg-white"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Stars rating={r.rating} />
                <p className="font-semibold text-navy mt-1.5">{r.title}</p>
              </div>
              {r.reviewDate && (
                <p className="text-xs text-muted shrink-0 mt-0.5">{formatDate(r.reviewDate)}</p>
              )}
            </div>
            <p className="mt-2 text-sm text-ink/80 leading-relaxed">{r.body}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-medium text-ink">{r.authorName}</span>
              {r.verified && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full font-medium">
                  ✓ Verified Purchase
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
