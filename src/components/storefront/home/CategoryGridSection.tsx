"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";

type CategoryItem = {
  category: { slug: string; name: string } | string | null;
  imageUrl?: string | null;
  labelOverride?: string | null;
};

type Props = {
  eyebrow?: string | null;
  title: string;
  items: CategoryItem[];
};

function resolveCategory(item: CategoryItem): { slug: string; name: string } | null {
  if (!item.category) return null;
  if (typeof item.category === "string") return { slug: item.category, name: item.category };
  return item.category;
}

export function CategoryGridSection({ eyebrow, title, items }: Props) {
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
  }, [items]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  const validItems = items.filter((item) => resolveCategory(item) !== null);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="font-display text-4xl text-navy mt-1">{title}</h2>
      </div>

      <div className="relative">
        {/* Prev arrow */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-cream-200 shadow hover:border-gold transition-colors text-navy text-lg"
          >
            ‹
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {validItems.map((item, idx) => {
            const cat = resolveCategory(item)!;
            const label = item.labelOverride || cat.name;
            return (
              <Link
                key={idx}
                href={`/collections/${cat.slug}`}
                className="group relative snap-start shrink-0 w-[200px] sm:w-[220px] aspect-[4/5] rounded-lg overflow-hidden bg-navy flex items-end p-5"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={label}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <span className="relative font-display text-2xl text-cream group-hover:text-gold transition-colors">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Next arrow */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-cream-200 shadow hover:border-gold transition-colors text-navy text-lg"
          >
            ›
          </button>
        )}
      </div>
    </section>
  );
}
