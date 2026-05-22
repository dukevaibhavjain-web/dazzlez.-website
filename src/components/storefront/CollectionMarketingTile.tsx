/**
 * CollectionMarketingTile — full-width promotional tile inserted into the
 * product grid at configurable positions.
 *
 * Server Component — receives pre-fetched tile data as props.
 *
 * Layout: text on the left, image on the right (stacked on mobile).
 * The tile spans the full grid width via col-span-full on the parent grid.
 */
import Link from "next/link";
import type { MarketingTileData } from "@/lib/storefront/catalog";

/** Maps the CMS backgroundColor select value → Tailwind classes */
const BG: Record<string, string> = {
  cream:  "bg-cream-200",
  white:  "bg-white border border-cream-200",
  blush:  "bg-[#fce8ec]",
  sage:   "bg-[#e8f5ee]",
  blue:   "bg-[#e8f0fc]",
  navy:   "bg-navy",
  gold:   "bg-gold/15 border border-gold/30",
};

/** Text/button colours invert on the dark navy background */
const IS_DARK: Record<string, boolean> = {
  navy: true,
};

export function CollectionMarketingTile({ tile }: { tile: MarketingTileData }) {
  const bgClass  = BG[tile.backgroundColor] ?? BG.cream;
  const isDark   = IS_DARK[tile.backgroundColor] ?? false;

  const titleCls = isDark ? "text-cream" : "text-navy";
  const bodyCls  = isDark ? "text-cream-200/80" : "text-muted";
  const btnCls   = isDark
    ? "bg-gold text-navy hover:bg-gold-300"
    : "bg-navy text-cream hover:bg-navy-700";

  return (
    <div className={`rounded-xl overflow-hidden ${bgClass}`}>
      <div className="flex flex-col sm:flex-row items-stretch">
        {/* ── Text side ─────────────────────────────────────────────────── */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
          <h3 className={`font-display text-2xl md:text-3xl leading-snug ${titleCls}`}>
            {tile.title}
          </h3>

          {tile.description && (
            <p className={`mt-3 text-sm md:text-base leading-relaxed max-w-sm ${bodyCls}`}>
              {tile.description}
            </p>
          )}

          {tile.ctaText && tile.ctaLink && (
            <Link
              href={tile.ctaLink}
              className={`inline-block mt-6 w-fit px-6 py-3 text-sm font-semibold rounded transition-colors ${btnCls}`}
            >
              {tile.ctaText}
            </Link>
          )}
        </div>

        {/* ── Image side ────────────────────────────────────────────────── */}
        {tile.imageUrl && (
          <div className="w-full sm:w-64 md:w-80 shrink-0 h-52 sm:h-auto overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tile.imageUrl}
              alt={tile.imageAlt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
}
