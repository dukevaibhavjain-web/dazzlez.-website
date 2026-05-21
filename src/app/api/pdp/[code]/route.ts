import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { computePriceFromSnapshot, loadRateSnapshot } from "@/lib/pricing";
import type { DiamondCategorySlug, ProductForPricing, Purity } from "@/lib/pricing/types";

/**
 * GET /api/pdp/[code]?metal=18K&carat=&size=6
 *
 * Returns prices for ALL THREE diamond tiers (natural / lab-premium /
 * lab-standard) in one call, plus fulfillment info — everything the PDP buy-box
 * and the natural-vs-lab widget need without multiple round-trips.
 */
const TIERS: DiamondCategorySlug[] = ["natural", "lab-premium", "lab-standard"];

export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const url = new URL(req.url);
  const metal = (url.searchParams.get("metal") ?? "18K") as Purity;
  const caratStr = url.searchParams.get("carat");
  const sizeStr = url.searchParams.get("size");
  const carat = caratStr ? Number(caratStr) : undefined;
  const size = sizeStr ? Number(sizeStr) : undefined;

  const payload = await getPayload({ config });
  const found = await payload.find({
    collection: "products",
    where: { code: { equals: code } },
    depth: 1,
    limit: 1,
  });
  if (found.totalDocs === 0) {
    return NextResponse.json({ ok: false, error: `Product '${code}' not found` }, { status: 404 });
  }
  const product = found.docs[0] as unknown as ProductForPricing & {
    fulfillmentType?: "made_to_order" | "ready_stock";
    stockQuantity?: number;
  };

  const snapshot = await loadRateSnapshot(payload);
  const variants: Record<string, { total: number; lineItems: unknown[] } | { error: string }> = {};

  for (const tier of TIERS) {
    try {
      const b = computePriceFromSnapshot(snapshot, {
        product,
        metalPurity: metal,
        diamondCategorySlug: tier,
        solitaireCarat: carat,
        ringSize: size,
      });
      variants[tier] = { total: b.total, lineItems: b.lineItems };
    } catch (e) {
      variants[tier] = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  // Site-wide disclaimer copy (graceful fallback if global not initialized)
  let settings: { madeToOrderDisclaimer?: string; readyStockBadgeText?: string; readyStockPriceNote?: string } = {};
  try {
    settings = (await payload.findGlobal({ slug: "site-settings" })) as never;
  } catch { /* defaults below */ }

  const fulfillmentType = product.fulfillmentType ?? "made_to_order";
  return NextResponse.json({
    ok: true,
    metal,
    variants,
    fulfillment: {
      type: fulfillmentType,
      stockQuantity: product.stockQuantity ?? 0,
      disclaimer:
        fulfillmentType === "made_to_order"
          ? settings.madeToOrderDisclaimer ||
            "Crafted to order. Price shown is an estimate at current rates; the final invoice is issued at dispatch and may vary slightly."
          : settings.readyStockPriceNote || "Confirmed price. Ships in 3-5 business days.",
      badge: fulfillmentType === "ready_stock" ? settings.readyStockBadgeText || "In Stock" : null,
    },
  });
}
