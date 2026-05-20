import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { computeProductPrice } from "@/lib/pricing";
import type {
  DiamondCategorySlug,
  ProductForPricing,
  Purity,
} from "@/lib/pricing/types";

/**
 * GET /api/quote/[code]?metal=18K&diamond=natural&carat=1&size=6
 *
 * Returns a JSON price breakup for the product. Used by:
 *  - PDP for live price (Phase 1B)
 *  - Natural-vs-Lab transparency widget
 *  - Quote saving (Phase 1B+)
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params;
  const url = new URL(req.url);
  const metal = (url.searchParams.get("metal") ?? "18K") as Purity;
  const diamond = (url.searchParams.get("diamond") ?? "natural") as DiamondCategorySlug;
  const caratStr = url.searchParams.get("carat");
  const sizeStr = url.searchParams.get("size");

  const payload = await getPayload({ config });

  const found = await payload.find({
    collection: "products",
    where: { code: { equals: code } },
    depth: 1,
    limit: 1,
  });

  if (found.totalDocs === 0) {
    return NextResponse.json(
      { ok: false, error: `Product code '${code}' not found` },
      { status: 404 },
    );
  }

  const product = found.docs[0] as unknown as ProductForPricing;

  try {
    const breakup = await computeProductPrice(payload, {
      product,
      metalPurity: metal,
      diamondCategorySlug: diamond,
      solitaireCarat: caratStr ? Number(caratStr) : undefined,
      ringSize: sizeStr ? Number(sizeStr) : undefined,
    });

    // Pull site-wide disclaimers and per-product fulfillment info so the
    // caller can render the right messaging.
    type Settings = {
      madeToOrderDisclaimer?: string;
      readyStockBadgeText?: string;
      readyStockPriceNote?: string;
      quoteValidityDays?: number;
    };
    let settings: Settings = {};
    try {
      settings = (await payload.findGlobal({ slug: "site-settings" })) as unknown as Settings;
    } catch {
      // Global not yet initialized — fall back to defaults.
    }
    const DEFAULT_MADE_TO_ORDER =
      "Most of our pieces are crafted to order. The price shown is an estimate based on current gold and diamond rates. The final invoice is issued at dispatch and may vary slightly.";
    const DEFAULT_READY_STOCK_NOTE = "Confirmed price. Ships within 3-5 business days.";
    const DEFAULT_READY_STOCK_BADGE = "In Stock — ready to ship";
    const productAny = found.docs[0] as unknown as {
      fulfillmentType?: "made_to_order" | "ready_stock";
      stockQuantity?: number;
    };

    return NextResponse.json({
      ok: true,
      breakup,
      fulfillment: {
        type: productAny.fulfillmentType ?? "made_to_order",
        stockQuantity: productAny.stockQuantity ?? 0,
        disclaimer:
          (productAny.fulfillmentType ?? "made_to_order") === "made_to_order"
            ? (settings.madeToOrderDisclaimer || DEFAULT_MADE_TO_ORDER)
            : (settings.readyStockPriceNote || DEFAULT_READY_STOCK_NOTE),
        badge:
          (productAny.fulfillmentType ?? "made_to_order") === "ready_stock"
            ? (settings.readyStockBadgeText || DEFAULT_READY_STOCK_BADGE)
            : null,
        quoteValidityDays: settings.quoteValidityDays ?? 7,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }
}
