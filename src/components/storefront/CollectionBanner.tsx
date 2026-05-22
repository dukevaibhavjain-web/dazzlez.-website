/**
 * CollectionBanner — full-width hero shown at the top of a collection page.
 *
 * Server Component — receives pre-fetched data as props, no client JS needed.
 *
 * If no banner is configured for the category, returns null so the page falls
 * back to its standard centred text header.
 */
import Link from "next/link";
import type { CollectionBannerData } from "@/lib/storefront/catalog";

type Props = {
  banner: CollectionBannerData | null;
  /** Shown as the eyebrow label on banners that have an image. */
  categoryName: string;
};

export function CollectionBanner({ banner, categoryName }: Props) {
  if (!banner) return null;

  const overlayAlpha = banner.overlayOpacity / 100;

  return (
    <div className="relative w-full h-72 md:h-[420px] overflow-hidden bg-navy">
      {/* Background image */}
      {banner.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.imageUrl}
          alt={banner.imageAlt}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Darkening overlay for text legibility */}
      {banner.overlayOpacity > 0 && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0,0,0,${overlayAlpha})` }}
        />
      )}

      {/* Content */}
      <div className="relative h-full flex items-center justify-center px-6 text-center">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <p className="eyebrow text-gold-300 mb-3">{categoryName}</p>

          {/* Title */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white leading-tight drop-shadow">
            {banner.title}
          </h1>

          {/* Subtitle */}
          {banner.subtitle && (
            <p className="mt-3 text-lg md:text-xl text-cream/85 font-light">
              {banner.subtitle}
            </p>
          )}

          {/* Description */}
          {banner.description && (
            <p className="mt-2 text-sm md:text-base text-cream/65 max-w-lg mx-auto leading-relaxed">
              {banner.description}
            </p>
          )}

          {/* CTA */}
          {banner.ctaText && banner.ctaLink && (
            <Link
              href={banner.ctaLink}
              className="inline-block mt-7 px-8 py-3 bg-gold text-navy text-sm font-semibold rounded hover:bg-gold-300 transition-colors"
            >
              {banner.ctaText}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
