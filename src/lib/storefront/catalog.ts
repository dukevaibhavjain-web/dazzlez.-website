/**
 * Storefront data helpers — read-only catalog access for public pages.
 * Uses Payload's local API directly (no HTTP roundtrip) in Server Components.
 *
 * Prices come from the denormalized fromPriceInr field (computed by
 * `pnpm refresh:prices`) so collection pages are fast — no per-request pricing.
 */
import { getPayload } from "payload";
import config from "@payload-config";
import { computePriceFromSnapshot, loadRateSnapshot } from "@/lib/pricing";
import type { ProductForPricing, Purity } from "@/lib/pricing/types";

export type ProductCardData = {
  id: string | number;
  code: string;
  slug: string;
  displayName: string;
  categoryName: string | null;
  heroUrl: string | null;
  heroAlt: string;
  fromPriceInr: number | null;
  /** The metal that produced fromPriceInr — carried into the PDP so its
   * headline price matches what the card showed. */
  fromMetal: Purity | null;
  fulfillmentType: "made_to_order" | "ready_stock";
};

export type CollectionFilters = {
  shape?: string; // shape slug
  metals?: Purity[]; // multi-select metal purities
  style?: string; // sub-category slug
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "featured" | "price-asc" | "price-desc";
  page?: number;
};

const GOLD_PURITIES: Purity[] = ["9K", "14K", "18K", "22K"];

export type FilterOption = { label: string; value: string };

function mediaUrl(media: unknown): string | null {
  if (!media || typeof media !== "object") return null;
  const m = media as { url?: string; sizes?: { card?: { url?: string } } };
  return m.sizes?.card?.url ?? m.url ?? null;
}

export function formatInr(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

/** Full product for the PDP (images + relations populated). */
export async function getProductBySlug(slug: string) {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "products",
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  });
  return res.docs[0] ?? null;
}

/** Similar products in the same category (excludes self). Uses stored fromPrice. */
export async function getSimilarProducts(
  categoryId: string | number,
  excludeId: string | number,
  limit = 4,
): Promise<ProductCardData[]> {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "products",
    where: {
      and: [
        { category: { equals: categoryId } },
        { id: { not_equals: excludeId } },
        { status: { not_equals: "archived" } },
      ],
    },
    depth: 1,
    limit,
    sort: "code",
  });
  return res.docs.map((doc) => {
    const p = doc as unknown as {
      id: string | number; code: string; slug: string; displayName: string;
      heroImage?: unknown; fromPriceInr?: number;
      fulfillmentType?: "made_to_order" | "ready_stock";
    };
    return {
      id: p.id, code: p.code, slug: p.slug, displayName: p.displayName,
      categoryName: null,
      heroUrl: mediaUrl(p.heroImage), heroAlt: p.displayName,
      fromPriceInr: p.fromPriceInr ?? null,
      fromMetal: null,
      fulfillmentType: p.fulfillmentType ?? "made_to_order",
    };
  });
}

/** Metal options to show on a PDP: gold purities in the recipe + Silver + Platinum. */
export function getMetalOptions(product: { metals?: Array<{ purity: string }> }): Array<{ value: Purity; label: string }> {
  const LABELS: Record<Purity, string> = {
    "9K": "9K Gold", "14K": "14K Gold", "18K": "18K Gold", "22K": "22K Gold",
    Silver925: "Silver 925", Platinum: "Platinum",
  };
  const golds = (["9K", "14K", "18K", "22K"] as Purity[]).filter((g) =>
    product.metals?.some((m) => m.purity === g),
  );
  const all: Purity[] = [...golds, "Silver925", "Platinum"];
  return all.map((v) => ({ value: v, label: LABELS[v] }));
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
  if (filters.inStock) and.push({ fulfillmentType: { equals: "ready_stock" } });

  // Pull all products matching the non-price (DB-level) filters. Price is
  // metal-dependent so we compute it in-memory from a single rate snapshot.
  const [res, snapshot] = await Promise.all([
    payload.find({ collection: "products", where: { and }, depth: 1, limit: 500 }),
    loadRateSnapshot(payload),
  ]);

  // Candidate metals: the ones the user selected, else the gold purities the
  // product actually has (cheapest gold becomes the default "from").
  const selectedMetals = filters.metals?.length ? filters.metals : null;

  type Row = ProductCardData & { _matches: boolean };
  const rows: Row[] = res.docs.map((doc) => {
    const p = doc as unknown as ProductForPricing & {
      slug: string;
      displayName: string;
      heroImage?: unknown;
      category?: { name?: string };
      fulfillmentType?: "made_to_order" | "ready_stock";
    };

    const candidates: Purity[] =
      selectedMetals ??
      GOLD_PURITIES.filter((g) => p.metals?.some((m) => m.purity === g));

    // Compute price for each candidate metal (Lab Standard = floor tier);
    // track which metal gave the cheapest price so the PDP can open on it.
    let best: { price: number; metal: Purity } | null = null;
    for (const metal of candidates) {
      try {
        const b = computePriceFromSnapshot(snapshot, {
          product: p,
          metalPurity: metal,
          diamondCategorySlug: "lab-standard",
        });
        if (!best || b.total < best.price) best = { price: b.total, metal };
      } catch {
        /* metal not resolvable for this product — skip */
      }
    }

    // Display the cheapest of the candidate metals — this is the number on the card.
    const displayPrice = best?.price ?? null;
    const fromMetal = best?.metal ?? null;

    // Price-range match: filter on the DISPLAYED price, so every card shown
    // has its visible price inside the selected range (no confusing mismatch
    // between what's shown and what was filtered).
    const min = filters.minPrice ?? 0;
    const max = filters.maxPrice ?? Number.POSITIVE_INFINITY;
    const priceFilterActive = filters.minPrice != null || filters.maxPrice != null;
    const matches = priceFilterActive
      ? displayPrice != null && displayPrice >= min && displayPrice <= max
      : true;

    return {
      id: p.id,
      code: p.code,
      slug: p.slug,
      displayName: p.displayName,
      categoryName: p.category?.name ?? null,
      heroUrl: mediaUrl(p.heroImage),
      heroAlt: p.displayName,
      fromPriceInr: displayPrice,
      fromMetal,
      fulfillmentType: p.fulfillmentType ?? "made_to_order",
      _matches: matches,
    };
  });

  const filtered = rows.filter((r) => r._matches);

  // Sort
  if (filters.sort === "price-asc") {
    filtered.sort((a, b) => (a.fromPriceInr ?? Infinity) - (b.fromPriceInr ?? Infinity));
  } else if (filters.sort === "price-desc") {
    filtered.sort((a, b) => (b.fromPriceInr ?? -Infinity) - (a.fromPriceInr ?? -Infinity));
  } else {
    filtered.sort((a, b) => a.code.localeCompare(b.code));
  }

  // Paginate in-memory
  const pageSize = 48;
  const page = filters.page ?? 1;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize).map(({ _matches, ...rest }) => {
    void _matches;
    return rest;
  });

  return { products: paged, total: filtered.length };
}
