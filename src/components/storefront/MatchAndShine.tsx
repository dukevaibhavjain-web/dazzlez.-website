/**
 * Match & Shine — complementary product recommendations.
 * Server component — all data passed as props from the PDP page.
 *
 * Shows ONLY the complementary products (not the current product —
 * the visitor is already on its page). Pairings are bidirectional:
 * page.tsx merges both forward and reverse relationships before passing here.
 */
import Link from "next/link";
import { formatInr } from "@/lib/storefront/catalog";

export type ComplementaryProduct = {
  slug: string;
  displayName: string;
  heroUrl: string | null;
  fromPriceInr: number | null;
};

export function MatchAndShine({
  recommendations,
}: {
  recommendations: ComplementaryProduct[];
}) {
  if (recommendations.length === 0) return null;

  return (
    <section className="mt-16">
      {/* Heading */}
      <div className="mb-8">
        <p className="eyebrow text-gold">Curated for You</p>
        <h2 className="font-display text-3xl text-navy mt-1">Match &amp; Shine</h2>
        <p className="text-sm text-muted mt-1">
          Designed to complement — meant to shine together.
        </p>
      </div>

      {/* Product grid — uniform cards, 2 columns on mobile, up to 4 on desktop */}
      <div
        className={`grid gap-4 sm:gap-6 ${
          recommendations.length === 1
            ? "grid-cols-1 sm:grid-cols-2 max-w-sm"
            : recommendations.length === 2
              ? "grid-cols-2 max-w-lg"
              : "grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {recommendations.map((p) => (
          <Link key={p.slug} href={`/product/${p.slug}`} className="group flex flex-col">
            {/* Image */}
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-cream-100 border border-cream-200 group-hover:border-gold/50 transition-colors">
              {p.heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.heroUrl}
                  alt={p.displayName}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                  No image
                </div>
              )}
            </div>

            {/* Info */}
            <p className="mt-3 text-sm font-medium text-navy leading-snug line-clamp-2 group-hover:text-gold transition-colors">
              {p.displayName}
            </p>
            {p.fromPriceInr != null && (
              <p className="text-xs text-muted mt-0.5">from {formatInr(p.fromPriceInr)}</p>
            )}
            <span className="mt-1.5 text-[11px] font-medium text-gold group-hover:underline">
              View details →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
