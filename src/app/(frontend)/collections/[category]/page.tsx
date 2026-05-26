import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getCategoryBySlug,
  getFilterOptions,
  getProductsForCategory,
  getCollectionBanner,
  getMarketingTiles,
  type CollectionFilters,
  type MarketingTileData,
} from "@/lib/storefront/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import { FilterBar } from "@/components/storefront/FilterBar";
import { ActiveFilterChips } from "@/components/storefront/ActiveFilterChips";
import { Pagination } from "@/components/storefront/Pagination";
import { CollectionBanner } from "@/components/storefront/CollectionBanner";
import { CollectionMarketingTile } from "@/components/storefront/CollectionMarketingTile";

const PAGE_SIZE = 48;

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) return { title: "Collection" };
  return {
    title: `${cat.name} — Lab-Grown & Natural Diamond ${cat.name}`,
    description: `Shop ${cat.name.toLowerCase()} at Dazzlez. Transparent pricing, certified diamonds, made to order.`,
  };
}

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { category } = await params;
  const sp = await searchParams;
  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();

  const page = Math.max(1, Number(str(sp.page) ?? 1) || 1);
  const metalCsv = str(sp.metal);
  const filters: CollectionFilters = {
    shape: str(sp.shape),
    metals: metalCsv
      ? (metalCsv.split(",").filter(Boolean) as CollectionFilters["metals"])
      : undefined,
    style: str(sp.style),
    minPrice: str(sp.min) ? Number(str(sp.min)) : undefined,
    maxPrice: str(sp.max) ? Number(str(sp.max)) : undefined,
    inStock: str(sp.inStock) === "1",
    sort: (str(sp.sort) as CollectionFilters["sort"]) ?? "featured",
    page,
  };

  const [{ products, total }, options, banner, tiles] = await Promise.all([
    getProductsForCategory(category, filters),
    getFilterOptions(cat.id),
    getCollectionBanner(cat.id),
    getMarketingTiles(cat.id),
  ]);

  // Build interleaved grid: products with marketing tiles spliced in
  const tilesByPos = new Map<number, MarketingTileData[]>();
  for (const tile of tiles) {
    const pos = tile.insertAfterNthProduct;
    if (!tilesByPos.has(pos)) tilesByPos.set(pos, []);
    tilesByPos.get(pos)!.push(tile);
  }

  type GridItem =
    | { type: "product"; data: (typeof products)[number] }
    | { type: "tile"; data: MarketingTileData };

  const gridItems: GridItem[] = [];
  products.forEach((p, idx) => {
    gridItems.push({ type: "product", data: p });
    // tiles are keyed to absolute position across all pages
    const absIdx = (page - 1) * PAGE_SIZE + idx + 1;
    const afterThis = tilesByPos.get(absIdx);
    if (afterThis) {
      for (const tile of afterThis) gridItems.push({ type: "tile", data: tile });
    }
  });

  const basePath = `/collections/${category}`;

  return (
    <>
      {/* Full-width banner image */}
      <CollectionBanner banner={banner} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        {/* Page header — always below the image */}
        <div className="text-center mb-10">
          <p className="eyebrow">Shop By</p>
          <h1 className="font-display text-4xl md:text-5xl text-navy mt-1">
            {banner?.title ?? cat.name}
          </h1>

          {banner?.subtitle && (
            <p className="text-muted mt-3 text-base md:text-lg max-w-xl mx-auto">
              {banner.subtitle}
            </p>
          )}
          {banner?.description && (
            <p className="text-muted mt-1 text-sm max-w-xl mx-auto leading-relaxed">
              {banner.description}
            </p>
          )}
          {banner?.ctaText && banner?.ctaLink && (
            <Link
              href={banner.ctaLink}
              className="inline-block mt-4 px-6 py-2.5 bg-navy text-cream text-sm font-semibold rounded hover:bg-navy/90 transition-colors"
            >
              {banner.ctaText}
            </Link>
          )}
          <p className="text-muted mt-3 text-sm">{total} designs</p>
        </div>

        {/* Filter bar (mobile trigger + desktop sidebar) + product grid */}
        <div className="flex flex-col md:flex-row gap-8">
          <Suspense fallback={<aside className="hidden md:block md:w-60 md:shrink-0" />}>
            <FilterBar
              shapes={options.shapes}
              styles={options.styles}
              metals={options.metals}
            />
          </Suspense>

          <div className="flex-1 min-w-0">
            {/* Active filter chips — desktop + mobile */}
            <Suspense fallback={null}>
              <ActiveFilterChips shapes={options.shapes} styles={options.styles} />
            </Suspense>

            {products.length === 0 ? (
              <p className="text-center text-muted py-20">
                No products match these filters. Try clearing some.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {gridItems.map((item, idx) =>
                    item.type === "product" ? (
                      <ProductCard key={item.data.id} product={item.data} />
                    ) : (
                      <div key={`tile-${item.data.id}-${idx}`} className="col-span-2 lg:col-span-3">
                        <CollectionMarketingTile tile={item.data} />
                      </div>
                    ),
                  )}
                </div>

                <Pagination
                  page={page}
                  total={total}
                  pageSize={PAGE_SIZE}
                  basePath={basePath}
                  searchParams={sp}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
