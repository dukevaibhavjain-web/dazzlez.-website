"use client";

import { useEffect, useState } from "react";

export type GoldColor = "yellow" | "white" | "rose" | "";

export type GalleryImage = {
  url: string;
  alt: string;
  /** Which gold color this render shows. "" = lifestyle / color-agnostic. */
  goldColor?: GoldColor;
};

/**
 * Filter images to show for the active gold color:
 *   - Images tagged with the exact color always show.
 *   - Images tagged "" (any / lifestyle) always show.
 *   - Images tagged with a DIFFERENT color are hidden.
 * Falls back to all images if nothing matches (safety net).
 */
function filterByColor(images: GalleryImage[], color: GoldColor): GalleryImage[] {
  if (!color) return images; // no color selected → show everything
  const filtered = images.filter((img) => !img.goldColor || img.goldColor === color);
  return filtered.length > 0 ? filtered : images;
}

export function ProductGallery({
  images,
  goldColor = "",
}: {
  images: GalleryImage[];
  goldColor?: GoldColor;
}) {
  const visible = filterByColor(images, goldColor);
  const [active, setActive] = useState(0);

  // Reset to first image whenever the visible set changes (color switch).
  useEffect(() => {
    setActive(0);
  }, [goldColor]);

  if (visible.length === 0) {
    return (
      <div className="aspect-square bg-cream-200 rounded-lg flex items-center justify-center text-muted">
        No image
      </div>
    );
  }

  const current = visible[Math.min(active, visible.length - 1)];

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3">
      {/* Thumbnails */}
      <div className="flex sm:flex-col gap-2 sm:w-20 overflow-x-auto sm:overflow-y-auto">
        {visible.map((img, i) => (
          <button
            key={`${img.url}-${i}`}
            onClick={() => setActive(i)}
            className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded overflow-hidden border-2 transition-colors ${
              i === active ? "border-gold" : "border-transparent hover:border-cream-200"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
      {/* Main image */}
      <div className="flex-1 aspect-square bg-white rounded-lg overflow-hidden border border-cream-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.alt} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
