import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
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
import { CollectionBanner } from "@/components/storefront/CollectionBanner";
import { CollectionMarketingTile } from "@/components/storefront/CollectionMarketingTile";

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
  };

  // Fetch all data in parallel — products, filters, and CMS content
  const [{ products, total }, options, banner, tiles] = await Promise.all([
    getProductsForCategory(category, filters),
    getFilterOptions(cat.id),
    getCollectionBanner(cat.id),
    getMarketingTiles(cat.id),
  ]);

  // ---------------------------------------------------------------------------
  // Build the interleaved grid item list:
  //   product, product, …, tile (spans full grid width), product, product, …
  //
  // Each tile declares insertAfterNthProduct (1-based index). Multiple tiles at
  // the same position are already sorted by displayOrder from the DB query.
  // ---------------------------------------------------------------------------
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
    // After the (idx+1)th product, inject any tiles configured for that position
    const afterThis = tilesByPos.get(idx + 1);
    if (afterThis) {
      for (const tile of afterThis) {
        gridItems.push({ type: "tile", data: tile });
      }
    }
  });

  return (
    <>
      {/* Full-width CMS banner — null means no banner configured for this category */}
      <CollectionBanner banner={banner} categoryName={cat.name} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        {/* Standard centred header — only shown when there is no banner */}
        {!banner && (
          <div className="text-center mb-10">
            <p className="eyebrow">Shop By</p>
            <h1 className="font-display text-4xl md:text-5xl text-navy mt-1">{cat.name}</h1>
            <p className="text-muted mt-2 text-sm">{total} designs</p>
          </div>
        )}

        {/* Product count shown below the banner when it handles the page heading */}
        {banner && (
          <p className="text-muted text-sm mb-6">{total} designs</p>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filter sidebar */}
          <Suspense fallback={<aside className="md:w-60 md:shrink-0" />}>
            <FilterBar shapes={options.shapes} styles={options.styles} metals={options.metals} />
          </Suspense>

          {/* Product grid with marketing tiles spliced in */}
          <div className="flex-1">
            {products.length === 0 ? (
              <p className="text-center text-muted py-20">
                No products match these filters. Try clearing some.
              </p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {gridItems.map((item, idx) =>
                  item.type === "product" ? (
                    <ProductCard key={item.data.id} product={item.data} />
                  ) : (
                    // Tiles span the full grid width
                    <div key={`tile-${item.data.id}-${idx}`} className="col-span-2 lg:col-span-3">
                      <CollectionMarketingTile tile={item.data} />
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
