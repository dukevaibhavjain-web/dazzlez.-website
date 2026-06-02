/**
 * Storefront data helpers — read-only catalog access for public pages.
 * Uses Payload's local API directly (no HTTP roundtrip) in Server Components.
 *
 * Prices come from the denormalized fromPriceInr field (computed by
 * `pnpm refresh:prices`) so collection pages are fast — no per-request pricing.
 *
 * ⚠️  Server-only: imports Payload + Sharp. Never import this file from a
 *    "use client" component. Use @/lib/storefront/types for shared types.
 */
import { getPayload } from "payload";
import config from "@payload-config";
import { computePriceFromSnapshot, loadRateSnapshot } from "@/lib/pricing";
import type { ProductForPricing, Purity } from "@/lib/pricing/types";

// Re-export all shared types so existing imports from catalog.ts keep working
export type {
  ProductCardData,
  CollectionFilters,
  FilterOption,
  MarketingTileData,
} from "@/lib/storefront/types";
export { formatInr } from "@/lib/storefront/types";

// Internal import for use within this file
import type {
  ProductCardData,
  CollectionFilters,
  FilterOption,
  MarketingTileData,
} from "@/lib/storefront/types";

const GOLD_PURITIES: Purity[] = ["9K", "14K", "18K", "22K"];

function mediaUrl(media: unknown): string | null {
  if (!media || typeof media !== "object") return null;
  const m = media as { url?: string; sizes?: { card?: { url?: string } } };
  return m.sizes?.card?.url ?? m.url ?? null;
}

/** Banners and tiles need a wider crop than the 400 px card thumbnail. */
function mediaBannerUrl(media: unknown): string | null {
  if (!media || typeof media !== "object") return null;
  const m = media as {
    url?: string;
    sizes?: { og?: { url?: string }; zoom?: { url?: string } };
  };
  return m.sizes?.og?.url ?? m.sizes?.zoom?.url ?? m.url ?? null;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload.find({ collection: "products", where: { and } as any, depth: 1, limit: 500 }),
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

// ---------------------------------------------------------------------------
// Collection page CMS content
// ---------------------------------------------------------------------------

export type CollectionBannerData = {
  id: string | number;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  /** Separate portrait/square crop shown on mobile (≤640 px). Falls back to imageUrl. */
  mobileImageUrl: string | null;
  imageAlt: string;
  ctaText: string | null;
  ctaLink: string | null;
};


/**
 * Returns the single active banner for a category, or null if none is
 * configured. When multiple are active the most-recently-updated wins.
 */
export async function getCollectionBanner(
  categoryId: string | number,
): Promise<CollectionBannerData | null> {
  const payload = await getPayload({ config });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await (payload as any).find({
    collection: "collection-banners",
    where: {
      and: [
        { category: { equals: categoryId } },
        { active: { equals: true } },
      ],
    },
    depth: 1,
    limit: 1,
    sort: "-updatedAt",
  });
  const doc = res.docs[0];
  if (!doc) return null;

  const d = doc as unknown as {
    id: string | number;
    title: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    mobileImageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
  };

  return {
    id: d.id,
    title: d.title,
    subtitle: d.subtitle ?? null,
    description: d.description ?? null,
    imageUrl: d.imageUrl ?? null,
    mobileImageUrl: d.mobileImageUrl ?? null,
    imageAlt: d.title,
    ctaText: d.ctaText ?? null,
    ctaLink: d.ctaLink ?? null,
  };
}

/**
 * Returns all active marketing tiles for a category, ordered by displayOrder.
 * Tiles are injected into the product grid by the collection page.
 */
export async function getMarketingTiles(
  categoryId: string | number,
): Promise<MarketingTileData[]> {
  const payload = await getPayload({ config });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await (payload as any).find({
    collection: "collection-marketing-tiles",
    where: {
      and: [
        { category: { equals: categoryId } },
        { active: { equals: true } },
      ],
    },
    depth: 1,
    limit: 20,
    sort: "displayOrder",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (res.docs as any[]).map((doc) => {
    const d = doc as {
      id: string | number;
      title: string;
      description?: string;
      imageUrl?: string;
      ctaText?: string;
      ctaLink?: string;
      backgroundColor?: string;
      insertAfterNthProduct?: number;
      displayOrder?: number;
    };
    return {
      id: d.id,
      title: d.title,
      description: d.description ?? null,
      imageUrl: d.imageUrl ?? null,
      imageAlt: d.title,
      ctaText: d.ctaText ?? null,
      ctaLink: d.ctaLink ?? null,
      backgroundColor: d.backgroundColor ?? "cream",
      insertAfterNthProduct: d.insertAfterNthProduct ?? 6,
      displayOrder: d.displayOrder ?? 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------

export type ShapeOption = {
  name: string;
  slug: string;
  iconUrl: string | null;
};

/** Returns all active shapes sorted by sortOrder. Used by ShapeGridSection. */
export async function getShapes(): Promise<ShapeOption[]> {
  try {
    const payload = await getPayload({ config });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (payload as any).find({
      collection: "shapes",
      sort: "sortOrder",
      limit: 50,
      depth: 1,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (res.docs as any[]).map((s) => ({
      name: s.name,
      slug: s.slug,
      iconUrl: mediaUrl(s.icon),
    }));
  } catch {
    // Postgres unavailable (e.g. cold Neon instance during build) — return empty
    return [];
  }
}

/**
 * Returns the raw HomePage global document (sections array).
 * Returns null when no sections have been saved yet (first run / empty CMS).
 * Callers should fall back to DEFAULT_SECTIONS when null is returned.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getHomePage(): Promise<any | null> {
  try {
    const payload = await getPayload({ config });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = await (payload as any).findGlobal({
      slug: "home-page",
      depth: 2, // populate category + product relationships
    });
    if (!doc?.sections?.length) return null;
    return doc;
  } catch {
    return null;
  }
}
