import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCategoryBySlug,
  getFilterOptions,
  getProductsForCategory,
  type CollectionFilters,
} from "@/lib/storefront/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import { FilterBar } from "@/components/storefront/FilterBar";

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

  const [{ products, total }, options] = await Promise.all([
    getProductsForCategory(category, filters),
    getFilterOptions(cat.id),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <p className="eyebrow">Shop By</p>
        <h1 className="font-display text-4xl md:text-5xl text-navy mt-1">{cat.name}</h1>
        <p className="text-muted mt-2 text-sm">{total} designs</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <FilterBar shapes={options.shapes} styles={options.styles} metals={options.metals} />

        <div className="flex-1">
          {products.length === 0 ? (
            <p className="text-center text-muted py-20">
              No products match these filters. Try clearing some.
            </p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
