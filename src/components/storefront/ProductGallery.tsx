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
 * Filter images to show for the active gold color.
 *
 * Order: color-specific images (exact match) FIRST, then "any" images
 * (lifestyle / hero tagged ""). This ensures that when the customer picks
 * White Gold, the first White Gold render becomes slide 0 — not the hero.
 *
 * Falls back to all images if nothing matches (safety net).
 */
function filterByColor(images: GalleryImage[], color: GoldColor): GalleryImage[] {
  if (!color) return images; // no color selected → show everything
  const exact = images.filter((img) => img.goldColor === color);
  const any   = images.filter((img) => !img.goldColor);
  const combined = [...exact, ...any];
  return combined.length > 0 ? combined : images;
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
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  // Reset to first image whenever color changes — ensures the variant's
  // first render shows immediately, not the previous hero.
  useEffect(() => {
    setActive(0);
  }, [goldColor]);

  if (visible.length === 0) {
    return (
      <div className="aspect-[4/5] bg-cream-200 rounded-xl flex items-center justify-center text-muted">
        No image
      </div>
    );
  }

  const current = visible[Math.min(active, visible.length - 1)];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      {/* Thumbnail strip — horizontal scroll on mobile, vertical on desktop */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden sm:pb-0 sm:w-[90px] sm:max-h-[540px]">
        {visible.map((img, i) => (
          <button
            key={`${img.url}-${i}`}
            onClick={() => setActive(i)}
            className={`shrink-0 w-16 h-16 sm:w-[90px] sm:h-[90px] rounded-lg overflow-hidden border-2 transition-all ${
              i === active
                ? "border-gold shadow-sm opacity-100"
                : "border-transparent opacity-60 hover:opacity-90 hover:border-cream-200"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>

      {/* Main image with cursor-tracking zoom */}
      <div
        className="relative flex-1 aspect-[4/5] bg-white rounded-xl overflow-hidden border border-cream-200 cursor-zoom-in select-none"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => {
          setZoomed(false);
          setOrigin("50% 50%");
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt}
          draggable={false}
          className="w-full h-full object-cover"
          style={{
            transformOrigin: origin,
            transform: zoomed ? "scale(2.2)" : "scale(1)",
            transition: zoomed ? "transform 0.08s ease-out" : "transform 0.2s ease-out",
          }}
        />
        {/* Slide counter */}
        {visible.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-navy/60 text-cream text-[11px] font-medium px-2 py-0.5 rounded-full pointer-events-none backdrop-blur-sm">
            {active + 1} / {visible.length}
          </div>
        )}
      </div>
    </div>
  );
}
