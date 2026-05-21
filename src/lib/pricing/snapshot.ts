/**
 * Snapshot-based pricing — load all rate tables ONCE, then compute prices
 * purely in memory. This is what makes collection pages (many products) fast:
 * instead of ~5 DB queries per product, we do ~5 queries total then compute
 * everything in-memory.
 *
 * computeProductPrice (in ./index.ts) wraps this for single-product callers.
 */
import type { Payload } from "payload";
import type {
  PriceBreakup,
  PriceLineItem,
  PricingInput,
  Purity,
} from "./types";
import { GST_RATE_PCT } from "./types";

type MakingRule = {
  type: "wastage_plus_making" | "flat";
  wastagePct: number;
  makingPerG: number;
  minMaking: number;
};
type DiamondBand = { min: number; max: number; ratePerCt: number };

export type RateSnapshot = {
  goldByPurity: Map<string, number>;
  diamondCategoryIdBySlug: Map<string, string | number>;
  diamondBandsByCategoryId: Map<string, DiamondBand[]>;
  makingByMetalType: Map<string, MakingRule>;
  colorStoneById: Map<string, { ratePerCt: number; name: string }>;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function loadRateSnapshot(payload: Payload): Promise<RateSnapshot> {
  const [gold, cats, dRates, making, stones] = await Promise.all([
    payload.find({ collection: "rate-gold", limit: 200, sort: "-effectiveAt" }),
    payload.find({ collection: "diamond-categories", limit: 100 }),
    payload.find({ collection: "rate-diamond", limit: 2000, sort: "-effectiveAt" }),
    payload.find({ collection: "making-rules", limit: 100 }),
    payload.find({ collection: "color-stones", limit: 2000 }),
  ]);

  const goldByPurity = new Map<string, number>();
  for (const d of gold.docs as any[]) {
    if (!goldByPurity.has(d.purity)) goldByPurity.set(d.purity, d.ratePerG); // first = most recent
  }

  const diamondCategoryIdBySlug = new Map<string, string | number>();
  for (const c of cats.docs as any[]) diamondCategoryIdBySlug.set(c.slug, c.id);

  const diamondBandsByCategoryId = new Map<string, DiamondBand[]>();
  for (const r of dRates.docs as any[]) {
    const catId = typeof r.diamondCategory === "object" ? r.diamondCategory?.id : r.diamondCategory;
    const key = String(catId);
    if (!diamondBandsByCategoryId.has(key)) diamondBandsByCategoryId.set(key, []);
    diamondBandsByCategoryId.get(key)!.push({
      min: r.ctBandMin,
      max: r.ctBandMax,
      ratePerCt: r.ratePerCt,
    });
  }

  const makingByMetalType = new Map<string, MakingRule>();
  for (const m of making.docs as any[]) {
    makingByMetalType.set(m.metalType, {
      type: m.type,
      wastagePct: m.wastagePct ?? 0,
      makingPerG: m.makingPerG,
      minMaking: m.minMaking ?? 0,
    });
  }

  const colorStoneById = new Map<string, { ratePerCt: number; name: string }>();
  for (const s of stones.docs as any[]) {
    colorStoneById.set(String(s.id), { ratePerCt: s.ratePerCt, name: s.name });
  }

  return {
    goldByPurity,
    diamondCategoryIdBySlug,
    diamondBandsByCategoryId,
    makingByMetalType,
    colorStoneById,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function purityToMetalType(purity: Purity): "gold" | "silver" | "platinum" {
  if (purity === "Silver925") return "silver";
  if (purity === "Platinum") return "platinum";
  return "gold";
}

/**
 * Resolve the metal weight (grams) to use for a given purity.
 *
 * Recipes from the Excel only carry gold weights (9K/14K/18K/22K). To make
 * EVERY design priceable in silver and platinum (needed for filtering AND
 * customization quotes), we fall back per the business rule:
 *   - Silver 925: use the 9K gram weight (same number)
 *   - Platinum:   use the 18K gram weight (same number)
 * Gram-number substitution, not density-adjusted (per spec).
 *
 * Returns { weightG, derivedFrom } or null if we can't resolve any weight.
 */
function resolveMetalWeight(
  product: PricingInput["product"],
  purity: Purity,
): { weightG: number; derivedFrom: Purity | null } | null {
  const direct = product.metals?.find((m) => m.purity === purity);
  if (direct) return { weightG: direct.weightG, derivedFrom: null };

  const weightOf = (p: Purity) => product.metals?.find((m) => m.purity === p)?.weightG;

  if (purity === "Silver925") {
    const w = weightOf("9K") ?? weightOf("14K") ?? weightOf("18K");
    if (w != null) return { weightG: w, derivedFrom: "9K" };
  }
  if (purity === "Platinum") {
    const w = weightOf("18K") ?? weightOf("14K") ?? weightOf("9K");
    if (w != null) return { weightG: w, derivedFrom: "18K" };
  }
  return null;
}

function lookupDiamondRate(bands: DiamondBand[], perStoneCt: number): number {
  const match = bands.find((b) => b.min <= perStoneCt && perStoneCt < b.max);
  if (match) return match.ratePerCt;
  const sorted = [...bands].sort((a, b) => b.max - a.max);
  return sorted[0]?.ratePerCt ?? 0;
}

export function computePriceFromSnapshot(
  snapshot: RateSnapshot,
  input: PricingInput,
): PriceBreakup {
  const { product, metalPurity, diamondCategorySlug, solitaireCarat, ringSize } = input;

  // ─── METAL ──────────────────────────────────────────────────────────
  const resolved = resolveMetalWeight(product, metalPurity);
  if (!resolved) {
    throw new Error(
      `Product ${product.code} cannot be priced in ${metalPurity}. Available: ${
        product.metals?.map((m) => m.purity).join(", ") ?? "(none)"
      }`,
    );
  }
  const weightG = resolved.weightG;
  const goldRate = snapshot.goldByPurity.get(metalPurity);
  if (!goldRate || goldRate <= 0) {
    throw new Error(`No rate for ${metalPurity}. Run 'pnpm seed:rates' or add one in admin.`);
  }
  const metalCost = weightG * goldRate;

  // ─── DIAMONDS ───────────────────────────────────────────────────────
  const catId = snapshot.diamondCategoryIdBySlug.get(diamondCategorySlug);
  if (catId == null) throw new Error(`No diamond-category for slug=${diamondCategorySlug}`);
  const bands = snapshot.diamondBandsByCategoryId.get(String(catId)) ?? [];

  const diamondComponents: PriceBreakup["components"]["diamonds"] = [];
  let diamondCost = 0;
  for (const d of product.diamonds ?? []) {
    let effectiveCt = d.weightCt;
    if (product.isSolitaire && d.role === "solitaire" && solitaireCarat && solitaireCarat > 0) {
      effectiveCt = solitaireCarat * d.count;
    }
    const ratePerCt = lookupDiamondRate(bands, effectiveCt / Math.max(1, d.count));
    const cost = effectiveCt * ratePerCt;
    diamondCost += cost;
    diamondComponents.push({
      role: d.role,
      weightCt: effectiveCt,
      count: d.count,
      ratePerCt,
      cost: Math.round(cost),
    });
  }

  // ─── COLOR STONES ───────────────────────────────────────────────────
  const colorStoneComponents: PriceBreakup["components"]["colorStones"] = [];
  let colorStoneCost = 0;
  for (const cs of product.colorStones ?? []) {
    const stoneId =
      typeof cs.stone === "string" || typeof cs.stone === "number" ? cs.stone : cs.stone.id;
    const stone = snapshot.colorStoneById.get(String(stoneId));
    const rate = stone?.ratePerCt ?? 0;
    const cost = cs.weightCt * rate;
    colorStoneCost += cost;
    colorStoneComponents.push({
      stone: stone?.name ?? "(stone)",
      weightCt: cs.weightCt,
      count: cs.count,
      ratePerCt: rate,
      cost: Math.round(cost),
    });
  }

  // ─── MAKING ─────────────────────────────────────────────────────────
  const metalType = purityToMetalType(metalPurity);
  const rule =
    snapshot.makingByMetalType.get(metalType) ??
    { type: "wastage_plus_making" as const, wastagePct: 8, makingPerG: 3000, minMaking: 0 };
  let makingCost: number;
  if (rule.type === "wastage_plus_making") {
    const wastageCost = weightG * (rule.wastagePct / 100) * goldRate;
    const makingFlat = weightG * rule.makingPerG;
    makingCost = Math.max(wastageCost + makingFlat, rule.minMaking ?? 0);
  } else {
    makingCost = Math.max(weightG * rule.makingPerG, rule.minMaking ?? 0);
  }

  // ─── TOTALS ─────────────────────────────────────────────────────────
  const subTotal = metalCost + diamondCost + colorStoneCost + makingCost;
  const gst = Math.round(subTotal * (GST_RATE_PCT / 100));
  const total = Math.round(subTotal + gst);

  const lineItems: PriceLineItem[] = [
    {
      label: `Metal (${metalPurity})`,
      detail: `${weightG.toFixed(3)}g × ₹${Math.round(goldRate).toLocaleString("en-IN")}/g`,
      amountInr: Math.round(metalCost),
    },
    ...diamondComponents.map((d) => ({
      label: d.role === "solitaire" ? "Solitaire Diamond" : "Diamonds (small)",
      detail: `${d.weightCt.toFixed(3)}ct${d.count > 1 ? ` × ${d.count}pc` : ""} × ₹${Math.round(d.ratePerCt).toLocaleString("en-IN")}/ct`,
      amountInr: d.cost,
    })),
    ...colorStoneComponents.map((cs) => ({
      label: `Color Stone — ${cs.stone}`,
      detail: `${cs.weightCt.toFixed(3)}ct × ₹${Math.round(cs.ratePerCt).toLocaleString("en-IN")}/ct`,
      amountInr: cs.cost,
    })),
    {
      label: "Making",
      detail:
        rule.type === "wastage_plus_making"
          ? `${rule.wastagePct}% wastage + ₹${rule.makingPerG}/g`
          : `₹${rule.makingPerG}/g (flat)`,
      amountInr: Math.round(makingCost),
    },
    { label: `GST (${GST_RATE_PCT}%)`, amountInr: gst },
  ];

  return {
    total,
    subTotal: Math.round(subTotal),
    gst,
    lineItems,
    components: {
      metal: { purity: metalPurity, weightG: weightG, ratePerG: goldRate, cost: Math.round(metalCost) },
      diamonds: diamondComponents,
      colorStones: colorStoneComponents,
      making: { type: rule.type, cost: Math.round(makingCost) },
      gstPct: GST_RATE_PCT,
    },
    inputs: {
      productCode: product.code,
      metalPurity,
      diamondCategorySlug,
      solitaireCarat,
      ringSize,
    },
  };
}
