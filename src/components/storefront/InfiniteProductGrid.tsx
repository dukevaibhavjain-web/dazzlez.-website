"use client";

/**
 * InfiniteProductGrid
 *
 * Renders the first page of products (SSR-provided) then loads subsequent
 * pages via an Intersection Observer on a sentinel div at the bottom.
 * Tiles are spliced in at the correct absolute positions across pages.
 *
 * The `key` prop on this component must change when filters change so React
 * unmounts/remounts and resets state (the parent passes key={JSON.stringify(filters)}).
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { CollectionMarketingTile } from "@/components/storefront/CollectionMarketingTile";
import type { CollectionFilters, ProductCardData, MarketingTileData } from "@/lib/storefront/types";
import { fetchProductPage } from "@/lib/actions/products";

type GridItem =
  | { type: "product"; data: ProductCardData }
  | { type: "tile"; data: MarketingTileData };

type Props = {
  /** First-page items already interleaved with tiles (from SSR). */
  initialItems: GridItem[];
  initialTotal: number;
  category: string;
  /** Filters WITHOUT the page field — the component manages page internally. */
  filters: Omit<CollectionFilters, "page">;
  /** All marketing tiles for this category (used to splice on subsequent pages). */
  tiles: MarketingTileData[];
  pageSize: number;
};

export function InfiniteProductGrid({
  initialItems,
  initialTotal,
  category,
  filters,
  tiles,
  pageSize,
}: Props) {
  const [items, setItems] = useState<GridItem[]>(initialItems);
  const [total] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialItems.filter((i) => i.type === "product").length >= initialTotal);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Build tile lookup: position → tiles
  const tilesByPos = new Map<number, MarketingTileData[]>();
  for (const tile of tiles) {
    const pos = tile.insertAfterNthProduct;
    if (!tilesByPos.has(pos)) tilesByPos.set(pos, []);
    tilesByPos.get(pos)!.push(tile);
  }

  const loadMore = useCallback(async () => {
    if (loading || done) return;
    setLoading(true);

    const nextPage = page + 1;
    try {
      const { products } = await fetchProductPage(category, {
        ...filters,
        page: nextPage,
      });

      if (!products.length) {
        setDone(true);
        return;
      }

      // Interleave tiles at absolute positions
      const newItems: GridItem[] = [];
      products.forEach((p, idx) => {
        newItems.push({ type: "product", data: p });
        const absIdx = (nextPage - 1) * pageSize + idx + 1;
        const afterThis = tilesByPos.get(absIdx);
        if (afterThis) {
          for (const tile of afterThis) newItems.push({ type: "tile", data: tile });
        }
      });

      setItems((prev) => [...prev, ...newItems]);
      setPage(nextPage);

      // Count total products loaded across all pages
      const totalProductsLoaded =
        nextPage * pageSize >= total
          ? total
          : nextPage * pageSize;
      if (totalProductsLoaded >= total) setDone(true);
    } finally {
      setLoading(false);
    }
  }, [loading, done, page, category, filters, pageSize, total, tilesByPos]);

  // Wire up the Intersection Observer
  useEffect(() => {
    if (done) return;
    const el = sentinelRef.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }, // start loading 400px before sentinel is visible
    );
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, loadMore]);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {items.map((item, idx) =>
          item.type === "product" ? (
            <ProductCard key={item.data.id} product={item.data} />
          ) : (
            <div key={`tile-${item.data.id}-${idx}`} className="col-span-2 lg:col-span-3">
              <CollectionMarketingTile tile={item.data} />
            </div>
          ),
        )}
      </div>

      {/* Sentinel / status row */}
      {!done && (
        <div ref={sentinelRef} className="flex justify-center py-10">
          {loading && (
            <div className="flex items-center gap-2 text-muted text-sm">
              <svg
                className="animate-spin h-4 w-4 text-gold"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Loading more…
            </div>
          )}
        </div>
      )}

      {done && items.length > 0 && (
        <p className="text-center text-muted text-sm py-10">
          All {total} designs shown
        </p>
      )}
    </>
  );
}
