/**
 * CollectionBanner — full-width hero image at the top of a collection page.
 *
 * Intentionally image-only. All text (title, subtitle, description, CTA) is
 * rendered by the collection page BELOW the image so it's always readable
 * regardless of image content or colour.
 *
 * Uses Next.js Image for optimized serving (WebP/AVIF, responsive sizing, lazy loading).
 * For mobile-specific crops, uncomment the mobileImageUrl branch below.
 *
 * Server Component — no client JS needed.
 */
import Image from "next/image";
import type { CollectionBannerData } from "@/lib/storefront/catalog";

export function CollectionBanner({ banner }: { banner: CollectionBannerData | null }) {
  if (!banner?.imageUrl) return null;

  return (
    <div className="w-full h-52 sm:h-72 md:h-[400px] overflow-hidden bg-cream-200 relative">
      <Image
        src={banner.imageUrl}
        alt={banner.imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    </div>
  );
}
