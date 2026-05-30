"use server";

/**
 * Server action: search products based on Design Advisor questionnaire answers.
 * Called from ChatbotResults (client component) on the /design page.
 *
 * Strategy: getProductsForCategory fetches up to 500 from DB, filters in-memory
 * for price, returns total + a 48-item page. We slice that in-memory set based
 * on the requested page / pageSize. This is accurate for catalog sizes < 48 per
 * filter combination (typical for a specialised jewelry brand).
 */

import { getProductsForCategory } from "@/lib/storefront/catalog";
import type { CollectionFilters, ProductCardData } from "@/lib/storefront/types";

const ALL_CATEGORIES = ["rings", "earrings", "necklaces", "bracelets"] as const;

export async function searchDesignProducts(
  category: string,
  filters: CollectionFilters,
  page: number = 1,
  pageSize: number = 10,
): Promise<{ products: ProductCardData[]; total: number }> {
  // Clamp pageSize to valid options
  const ps = ([10, 20, 30] as number[]).includes(pageSize) ? pageSize : 10;
  const p = Math.max(1, page);

  if (!category) {
    // "Other" product type — search across all 4 categories and merge
    const results = await Promise.all(
      ALL_CATEGORIES.map((cat) =>
        getProductsForCategory(cat, { ...filters, page: 1 }),
      ),
    );
    const allProducts: ProductCardData[] = results.flatMap((r) => r.products);
    const total = results.reduce((sum, r) => sum + r.total, 0);
    const start = (p - 1) * ps;
    return { products: allProducts.slice(start, start + ps), total };
  }

  // Single category: getProductsForCategory returns up to 48 sorted, filtered
  // products (fetched from DB up to 500). We slice here for our page size.
  const { products: allProducts, total } = await getProductsForCategory(category, {
    ...filters,
    page: 1, // always pull the first in-memory batch; we paginate below
  });

  const start = (p - 1) * ps;
  return { products: allProducts.slice(start, start + ps), total };
}
