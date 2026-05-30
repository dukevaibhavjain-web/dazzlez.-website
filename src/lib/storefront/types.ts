/**
 * Shared storefront types that are safe to import in both Server and Client
 * components. No Payload / Node.js-only dependencies here.
 */

import type { Purity } from "@/lib/pricing/types";

export type { Purity };

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
  shape?: string;
  metals?: Purity[];
  style?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "featured" | "price-asc" | "price-desc";
  page?: number;
};

export type FilterOption = { label: string; value: string };

export type MarketingTileData = {
  id: string | number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string;
  ctaText: string | null;
  ctaLink: string | null;
  /** value from select: cream | white | blush | sage | blue | navy | gold */
  backgroundColor: string;
  /** Tile is injected into the grid after this many products */
  insertAfterNthProduct: number;
  displayOrder: number;
};

export function formatInr(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}
