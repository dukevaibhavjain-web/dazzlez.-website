/**
 * CollectionBanner — full-width hero image at the top of a collection page.
 *
 * Intentionally image-only. All text (title, subtitle, description, CTA) is
 * rendered by the collection page BELOW the image so it's always readable
 * regardless of image content or colour.
 *
 * Supports a separate mobileImageUrl shown on screens ≤ 640 px via <picture>.
 * Falls back to the desktop image when no mobile image is configured.
 *
 * Server Component — no client JS needed.
 */
import type { CollectionBannerData } from "@/lib/storefront/catalog";

export function CollectionBanner({ banner }: { banner: CollectionBannerData | null }) {
  if (!banner?.imageUrl) return null;

  return (
    <div className="w-full h-52 sm:h-72 md:h-[400px] overflow-hidden bg-cream-200">
      <picture className="block w-full h-full">
        {/* Portrait/square crop for narrow screens */}
        {banner.mobileImageUrl && (
          <source media="(max-width: 640px)" srcSet={banner.mobileImageUrl} />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner.imageUrl}
          alt={banner.imageAlt}
          className="w-full h-full object-cover"
        />
      </picture>
    </div>
  );
}
