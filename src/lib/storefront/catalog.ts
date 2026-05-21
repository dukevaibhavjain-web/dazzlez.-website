/**
 * Storefront data helpers — read-only catalog access for public pages.
 * Uses Payload's local API directly (no HTTP roundtrip) in Server Components.
 *
 * Prices come from the denormalized fromPriceInr field (computed by
 * `pnpm refresh:prices`) so collection pages are fast — no per-request pricing.
 */
import { getPayload } from "payload";
import config from "@payload-config";

export type ProductCardData = {
  id: string | number;
  code: string;
  slug: string;
  displayName: string;
  categoryName: string | null;
  heroUrl: string | null;
  heroAlt: string;
  fromPriceInr: number | null;
  fulfillmentType: "made_to_order" | "ready_stock";
};

export type CollectionFilters = {
  shape?: string; // shape slug
  metal?: string; // purity value e.g. "18K"
  style?: string; // sub-category slug
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "featured" | "price-asc" | "price-desc";
  page?: number;
};

export type FilterOption = { label: string; value: string };

function mediaUrl(media: unknown): string | null {
  if (!media || typeof media !== "object") return null;
  const m = media as { url?: string; sizes?: { card?: { url?: string } } };
  return m.sizes?.card?.url ?? m.url ?? null;
}

export function formatInr(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

export async function getCategories() {
  const payload = await getPayload({ config });
  const res = await payload.find({ collection: "categories", sort: "sortOrder", limit: 100 });
  return res.docs as Array<{ id: string | number; name: string; slug: string }>;
}

export async function getCategoryBySlug(slug: string) {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "categories",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  return res.docs[0] as { id: string | number; name: string; slug: string } | undefined;
}

/** Filter options available for a category's filter UI. */
export async function getFilterOptions(categoryId: string | number): Promise<{
  shapes: FilterOption[];
  styles: FilterOption[];
  metals: FilterOption[];
}> {
  const payload = await getPayload({ config });
  const [shapeRes, subRes] = await Promise.all([
    payload.find({ collection: "shapes", sort: "sortOrder", limit: 100 }),
    payload.find({
      collection: "sub-categories",
      where: { category: { equals: categoryId } },
      sort: "sortOrder",
      limit: 100,
    }),
  ]);
  return {
    shapes: shapeRes.docs.map((s) => ({
      label: (s as { name: string }).name,
      value: (s as { slug: string }).slug,
    })),
    styles: subRes.docs.map((s) => ({
      label: (s as { name: string }).name,
      value: (s as { slug: string }).slug,
    })),
    metals: [
      { label: "9K Gold", value: "9K" },
      { label: "14K Gold", value: "14K" },
      { label: "18K Gold", value: "18K" },
      { label: "22K Gold", value: "22K" },
      { label: "Silver 925", value: "Silver925" },
      { label: "Platinum", value: "Platinum" },
    ],
  };
}

export async function getProductsForCategory(
  categorySlug: string,
  filters: CollectionFilters = {},
): Promise<{ products: ProductCardData[]; total: number }> {
  const payload = await getPayload({ config });
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return { products: [], total: 0 };

  // Resolve shape/style slugs → ids for relationship filtering
  const and: Record<string, unknown>[] = [
    { category: { equals: category.id } },
    { status: { not_equals: "archived" } },
  ];

  if (filters.shape) {
    const shapeDoc = await payload.find({
      collection: "shapes",
      where: { slug: { equals: filters.shape } },
      limit: 1,
    });
    if (shapeDoc.docs[0]) and.push({ primaryShape: { equals: shapeDoc.docs[0].id } });
  }
  if (filters.style) {
    const subDoc = await payload.find({
      collection: "sub-categories",
      where: { slug: { equals: filters.style } },
      limit: 1,
    });
    if (subDoc.docs[0]) and.push({ subCategory: { equals: subDoc.docs[0].id } });
  }
  if (filters.metal) and.push({ "metals.purity": { equals: filters.metal } });
  if (filters.inStock) and.push({ fulfillmentType: { equals: "ready_stock" } });
  if (filters.minPrice != null) and.push({ fromPriceInr: { greater_than_equal: filters.minPrice } });
  if (filters.maxPrice != null) and.push({ fromPriceInr: { less_than_equal: filters.maxPrice } });

  const sort =
    filters.sort === "price-asc"
      ? "fromPriceInr"
      : filters.sort === "price-desc"
        ? "-fromPriceInr"
        : "code";

  const res = await payload.find({
    collection: "products",
    where: { and },
    depth: 1,
    limit: 48,
    page: filters.page ?? 1,
    sort,
  });

  const products: ProductCardData[] = res.docs.map((doc) => {
    const p = doc as unknown as {
      id: string | number;
      code: string;
      slug: string;
      displayName: string;
      heroImage?: unknown;
      category?: { name?: string };
      fromPriceInr?: number;
      fulfillmentType?: "made_to_order" | "ready_stock";
    };
    return {
      id: p.id,
      code: p.code,
      slug: p.slug,
      displayName: p.displayName,
      categoryName: p.category?.name ?? null,
      heroUrl: mediaUrl(p.heroImage),
      heroAlt: p.displayName,
      fromPriceInr: p.fromPriceInr ?? null,
      fulfillmentType: p.fulfillmentType ?? "made_to_order",
    };
  });

  return { products, total: res.totalDocs };
}
