/**
 * Recompute and store fromPriceInr for every product.
 *
 * fromPrice = cheapest realistic variant (cheapest available metal + Lab
 * Standard diamond), incl. GST. Denormalized onto the product so collection
 * pages can filter/sort by price without computing per request.
 *
 * Run after an Excel import, or whenever rates change materially.
 *   pnpm refresh:prices
 */
import { getPayload } from "payload";
import config from "../src/payload.config.js";
import { computePriceFromSnapshot, loadRateSnapshot } from "../src/lib/pricing/index.js";
import type { ProductForPricing, Purity } from "../src/lib/pricing/types.js";

const METAL_PREFERENCE: Purity[] = ["9K", "14K", "18K", "22K", "Silver925", "Platinum"];

function cheapestMetal(product: ProductForPricing): Purity | null {
  const available = new Set((product.metals ?? []).map((m) => m.purity));
  for (const p of METAL_PREFERENCE) if (available.has(p)) return p;
  return null;
}

async function main() {
  const payload = await getPayload({ config });
  const snapshot = await loadRateSnapshot(payload);

  let page = 1;
  let updated = 0;
  let skipped = 0;

  // Paginate through all products
  while (true) {
    const res = await payload.find({
      collection: "products",
      depth: 0,
      limit: 100,
      page,
    });

    for (const doc of res.docs) {
      const p = doc as unknown as ProductForPricing & { id: string | number };
      const metal = cheapestMetal(p);
      if (!metal) {
        skipped++;
        continue;
      }
      try {
        const breakup = computePriceFromSnapshot(snapshot, {
          product: p,
          metalPurity: metal,
          diamondCategorySlug: "lab-standard",
        });
        await payload.update({
          collection: "products",
          id: p.id,
          data: { fromPriceInr: breakup.total },
        });
        updated++;
      } catch {
        skipped++;
      }
    }

    if (page >= res.totalPages) break;
    page++;
  }

  console.log(`\n✅ Refreshed prices. Updated: ${updated}, Skipped: ${skipped}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ refresh:prices failed:");
  console.error(err);
  process.exit(1);
});
