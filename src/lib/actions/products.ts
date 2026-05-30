"use server";

import { getProductsForCategory } from "@/lib/storefront/catalog";
import type { CollectionFilters, ProductCardData } from "@/lib/storefront/types";

export type FetchProductPageResult = {
  products: ProductCardData[];
  total: number;
};

export async function fetchProductPage(
  category: string,
  filters: CollectionFilters,
): Promise<FetchProductPageResult> {
  return getProductsForCategory(category, filters);
}
