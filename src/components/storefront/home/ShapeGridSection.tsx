"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import type { ShapeOption } from "@/lib/storefront/catalog";

type Props = {
  eyebrow?: string | null;
  title?: string | null;
  backgroundColor?: "cream" | "white" | "navy";
  linkToCategory?: string | null;
  shapes: ShapeOption[];
};

const BG: Record<string, string> = { cream: "bg-cream-200", white: "bg-white", navy: "bg-navy" };
const TEXT: Record<string, string> = { cream: "text-navy", white: "text-navy", navy: "text-cream" };
const CHIP: Record<string, string> = {
  cream: "bg-white text-ink border-cream-200 hover:border-gold hover:text-gold",
  white: "bg-cream-200 text-ink border-cream-200 hover:border-gold hover:text-gold",
  navy: "bg-navy-600 text-cream border-cream/20 hover:border-gold hover:text-gold",
};

export function ShapeGridSection({
  eyebrow,
  title,
  backgroundColor = "cream",
  linkToCategory = "/collections/rings",
  shapes,
}: Props) {
  const bg = BG[backgroundColor] ?? BG.cream;
  const text = TEXT[backgroundColor] ?? TEXT.cream;
  const chip = CHIP[backgroundColor] ?? CHIP.cream;
  const base = linkToCategory ?? "/collections/rings";

  // Mobile horizontal scroll refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [shapes.length]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  };

  return (
    <section className={`${bg} py-16`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {(eyebrow || title) && (
          <div className="text-center mb-10">
            {eyebrow && <p className={`eyebrow ${text}`}>{eyebrow}</p>}
            {title && <h2 className={`font-display text-4xl mt-1 ${text}`}>{title}</h2>}
          </div>
        )}

        {/* Desktop: flex-wrap centred. Mobile: horizontal scroll */}
        <div className="hidden md:flex flex-wrap justify-center gap-3">
          {shapes.map((shape) => (
            <Link
              key={shape.slug}
              href={`${base}?shape=${shape.slug}`}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full border text-sm transition-colors ${chip}`}
            >
              {shape.iconUrl && (
                <img src={shape.iconUrl} alt="" className="w-4 h-4 object-contain" aria-hidden />
              )}
              {shape.name}
            </Link>
          ))}
        </div>

        {/* Mobile scroll */}
        <div className="md:hidden relative">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 border border-cream-200 shadow text-navy text-base`}
            >
              ‹
            </button>
          )}
          <div
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 scrollbar-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {shapes.map((shape) => (
              <Link
                key={shape.slug}
                href={`${base}?shape=${shape.slug}`}
                className={`snap-start shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm transition-colors ${chip}`}
              >
                {shape.iconUrl && (
                  <img src={shape.iconUrl} alt="" className="w-4 h-4 object-contain" aria-hidden />
                )}
                {shape.name}
              </Link>
            ))}
          </div>
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 border border-cream-200 shadow text-navy text-base"
            >
              ›
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
