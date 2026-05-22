/**
 * Compact star-rating badge shown above the product title in the buy box.
 * Clicking it scrolls smoothly to the reviews section below.
 *
 * Pure display — receives avgRating + totalReviews as props from the
 * server component so no client-side fetch is needed.
 */
export function ReviewBadge({
  avgRating,
  totalReviews,
}: {
  avgRating: number;
  totalReviews: number;
}) {
  if (totalReviews === 0) return null;

  const rounded = Math.round(avgRating * 2) / 2; // nearest 0.5
  const fullStars = Math.floor(rounded);
  const halfStar = rounded % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <a
      href="#reviews"
      className="inline-flex items-center gap-1.5 mb-3 group"
      aria-label={`${avgRating} out of 5 stars, ${totalReviews} reviews`}
    >
      {/* Stars */}
      <span className="flex items-center leading-none" aria-hidden>
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`f${i}`} className="text-gold text-base">★</span>
        ))}
        {halfStar && (
          <span className="text-base" style={{ color: "#E8C44D", opacity: 0.6 }}>★</span>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`e${i}`} className="text-cream-200 text-base">★</span>
        ))}
      </span>
      <span className="text-sm font-semibold text-navy">{avgRating.toFixed(1)}</span>
      <span className="text-sm text-muted group-hover:text-gold transition-colors">
        · {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
      </span>
    </a>
  );
}
