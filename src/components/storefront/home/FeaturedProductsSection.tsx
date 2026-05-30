"use client";

import { useRef, useState, useEffect } from "react";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { ProductCardData, Purity } from "@/lib/storefront/types";

// ── Types ────────────────────────────────────────────────────────────────────

type FeaturedItem = {
  /** Raw Payload product document (depth 2) or an ID string when not populated */
  product: unknown;
  /** Optional metal purity override — affects the card link and PDP default view */
  metal?: string | null;
};

type Props = {
  eyebrow?: string | null;
  title: string;
  items: FeaturedItem[];
};

// ── Data mapping ─────────────────────────────────────────────────────────────

/**
 * Map a raw Payload product document (depth-2 fetch) to the ProductCardData
 * shape that <ProductCard> expects.
 *
 * Payload expands:
 *   heroImage → { url, filename, ... }
 *   category  → { id, name, slug, ... }
 */
function toCardData(
  raw: Record<string, unknown>,
  metalOverride?: string | null,
): ProductCardData | null {
  if (!raw || typeof raw !== "object") return null;
  const slug = raw.slug as string | undefined;
  if (!slug) return null;

  // heroImage is a Payload Media document when depth ≥ 1
  const heroImage = raw.heroImage as { url?: string } | null | undefined;
  const heroUrl = heroImage?.url ?? null;

  // category is a Payload Category document when depth ≥ 2
  const cat = raw.category as { name?: string } | string | null | undefined;
  const categoryName =
    cat && typeof cat === "object" && cat.name ? cat.name : null;

  const metal =
    (metalOverride as Purity | undefined) ||
    (raw.fromMetal as Purity | undefined) ||
    null;

  return {
    id: raw.id as string | number,
    code: (raw.code as string) ?? "",
    slug,
    displayName: (raw.displayName as string) ?? "",
    categoryName,
    heroUrl,
    heroAlt: (raw.displayName as string) ?? "",
    fromPriceInr: (raw.fromPriceInr as number | null) ?? null,
    fromMetal: metal,
    fulfillmentType:
      (raw.fulfillmentType as "made_to_order" | "ready_stock") ??
      "made_to_order",
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function FeaturedProductsSection({ eyebrow, title, items }: Props) {
  const products = items
    .map((item) => {
      const raw = item.product;
      if (!raw || typeof raw !== "object") return null;
      return toCardData(raw as Record<string, unknown>, item.metal);
    })
    .filter((p): p is ProductCardData => p !== null);

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
  }, [products.length]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  };

  if (!products.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="font-display text-4xl text-navy mt-1">{title}</h2>
      </div>

      <div className="relative">
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

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <div key={product.id} className="snap-start shrink-0 w-[220px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

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
