"use client";

/**
 * ChatbotResults — product grid shown after the Design Advisor questionnaire.
 *
 * Features:
 *  - Initial load calls searchDesignProducts server action
 *  - "Show: 10 / 20 / 30" dropdown resets and reloads
 *  - "Load X more" button appends next page
 *  - Skeleton loading cards during fetch
 *  - Empty state when no products match
 */

import { useState, useEffect, useRef } from "react";
import { searchDesignProducts } from "@/lib/actions/designSearch";
import { ProductCard } from "@/components/storefront/ProductCard";
import { pixel } from "@/lib/pixel";
import type { CollectionFilters, ProductCardData } from "@/lib/storefront/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type PageSize = 10 | 20 | 30;

type Props = {
  category: string;
  filters: CollectionFilters;
  initialPageSize?: PageSize;
  productLabel?: string;
  budgetLabel?: string;
};

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-lg overflow-hidden border border-cream-200 animate-pulse">
      <div className="aspect-square bg-cream-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-cream-200 rounded w-3/4" />
        <div className="h-2 bg-cream-200 rounded w-1/2" />
        <div className="h-3 bg-cream-200 rounded w-1/3 mt-2" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ChatbotResults({
  category,
  filters,
  initialPageSize = 10,
  productLabel = "items",
  budgetLabel = "",
}: Props) {
  const [pageSize, setPageSize] = useState<PageSize>(initialPageSize);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const trackedRef = useRef(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchProducts = async (
    p: number,
    ps: PageSize,
    append: boolean,
  ) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const result = await searchDesignProducts(category, filters, p, ps);

      if (append) {
        setProducts((prev) => [...prev, ...result.products]);
      } else {
        setProducts(result.products);
        setTotal(result.total);
        // Fire pixel event once on first successful load
        if (!trackedRef.current && result.products.length > 0) {
          trackedRef.current = true;
          pixel.productResultsViewed(result.total, productLabel);
        }
      }
      setPage(p);
    } catch (err) {
      console.error("[ChatbotResults] fetch error", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts(1, pageSize, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePageSizeChange = (newSize: PageSize) => {
    setPageSize(newSize);
    fetchProducts(1, newSize, false);
  };

  const handleLoadMore = () => {
    pixel.loadMoreClicked(page + 1);
    fetchProducts(page + 1, pageSize, true);
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const hasMore = products.length < total;
  const remaining = Math.min(pageSize, total - products.length);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {loading ? (
          <div className="h-4 w-40 bg-cream-200 rounded animate-pulse" />
        ) : (
          <p className="text-sm text-muted">
            {total === 0 ? (
              "No exact matches found"
            ) : (
              <>
                Showing{" "}
                <span className="font-medium text-navy">{products.length}</span>{" "}
                of{" "}
                <span className="font-medium text-navy">{total}</span>{" "}
                matching{" "}
                <span className="font-medium text-navy">
                  {productLabel || "pieces"}
                </span>
                {budgetLabel && (
                  <span className="text-muted"> · {budgetLabel}</span>
                )}
              </>
            )}
          </p>
        )}

        {/* Page-size selector */}
        <label className="flex items-center gap-2 text-sm text-muted">
          Show
          <select
            value={pageSize}
            onChange={(e) =>
              handlePageSizeChange(Number(e.target.value) as PageSize)
            }
            className="border border-navy/15 rounded-lg px-2 py-1 text-navy bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
          </select>
        </label>
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: pageSize }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : total === 0 ? (
        /* Empty state */
        <div className="text-center py-16 border border-dashed border-navy/10 rounded-2xl">
          <p className="text-3xl mb-3">💎</p>
          <p className="font-medium text-navy mb-1">No exact matches found</p>
          <p className="text-sm text-muted max-w-xs mx-auto">
            Try adjusting your budget, or fill the form to let us handpick
            options for you.
          </p>
          {category && (
            <a
              href={`/collections/${category}`}
              className="inline-block mt-4 text-sm text-gold hover:underline"
            >
              Browse all {productLabel} →
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {/* Append skeletons while loading more */}
          {loadingMore &&
            Array.from({ length: pageSize }).map((_, i) => (
              <SkeletonCard key={`more-${i}`} />
            ))}
        </div>
      )}

      {/* Load more */}
      {!loading && hasMore && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-8 py-3 border border-navy/20 text-navy text-sm font-medium rounded-full hover:border-gold hover:text-gold transition-colors disabled:opacity-50"
          >
            {loadingMore
              ? "Loading…"
              : `Load ${remaining} more`}
          </button>
        </div>
      )}
    </div>
  );
}
