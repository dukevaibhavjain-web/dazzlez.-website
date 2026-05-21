"use client";

import { useState } from "react";

export type GalleryImage = { url: string; alt: string };

export function ProductGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="aspect-square bg-cream-200 rounded-lg flex items-center justify-center text-muted">
        No image
      </div>
    );
  }
  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3">
      {/* Thumbnails */}
      <div className="flex sm:flex-col gap-2 sm:w-20 overflow-x-auto sm:overflow-y-auto">
        {images.map((img, i) => (
          <button
            key={i}
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
        <img src={images[active].url} alt={images[active].alt} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
