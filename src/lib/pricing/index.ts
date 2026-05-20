/**
 * Pricing engine — pure function over a product + rate snapshot.
 *
 * Given:
 *   - A product (with embedded metals/diamonds/colorStones arrays)
 *   - A metal purity choice (9K, 14K, 18K, 22K, Silver925, Platinum)
 *   - A diamond category choice (natural / lab-premium / lab-standard)
 *   - Optional variant overrides (solitaire carat, ring size)
 *
 * Returns:
 *   - Total INR (incl. GST)
 *   - Itemized line items (for the PDP price breakup accordion)
 *   - Machine-readable components (for invoices, analytics)
 *
 * Rules:
 *   - Gold rate × metal weight → metal cost
 *   - For each diamond row: ct-band lookup → INR/ct × total ct → diamond cost
 *   - For each color stone row: stone master rate × ct → color stone cost
 *   - Making: per category rule. wastage_plus_making OR flat. minMaking floor.
 *   - GST: 3% on subtotal.
 *
 * If solitaireCarat is provided AND product.isSolitaire, the center stone's
 * weight is replaced (variant pricing for 1/2/3ct solitaire pieces).
 */
import type { Payload } from "payload";
import type {
  DiamondCategorySlug,
  PriceBreakup,
  PriceLineItem,
  PricingInput,
  Purity,
} from "./types";
import { GST_RATE_PCT } from "./types";

async function getGoldRate(payload: Payload, purity: Purity): Promise<number> {
  const r = await payload.find({
    collection: "rate-gold",
    // @ts-expect-error — generated types may not include new fields until next type-gen
    where: { purity: { equals: purity } },
    sort: "-effectiveAt",
    limit: 1,
  });
  if (r.docs.length === 0) {
    throw new Error(
      `No rate-gold entry for purity=${purity}. Run 'pnpm seed:rates' or add one in admin.`,
    );
  }
  const rate = (r.docs[0] as unknown as { ratePerG: number }).ratePerG;
  if (!rate || rate <= 0) {
    throw new Error(`rate-gold for ${purity} has invalid ratePerG=${rate}`);
  }
  return rate;
}

async function getDiamondCategoryId(
  payload: Payload,
  slug: DiamondCategorySlug,
): Promise<string | number> {
  const r = await payload.find({
    collection: "diamond-categories",
    // @ts-expect-error
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (r.totalDocs === 0) {
    throw new Error(`No diamond-category for slug=${slug}`);
  }
  return r.docs[0].id;
}

async function getDiamondRate(
  payload: Payload,
  categoryId: string | number,
  weightCt: number,
): Promise<number> {
  const r = await payload.find({
    collection: "rate-diamond",
    // @ts-expect-error
    where: {
      and: [
        { diamondCategory: { equals: categoryId } },
        { ctBandMin: { less_than_equal: weightCt } },
        { ctBandMax: { greater_than: weightCt } },
      ],
    },
    sort: "-effectiveAt",
    limit: 1,
  });
  if (r.docs.length > 0) {
    return (r.docs[0] as unknown as { ratePerCt: number }).ratePerCt;
  }

  // Fallback — use the highest-band rate (for stones above any defined band).
  const last = await payload.find({
    collection: "rate-diamond",
    // @ts-expect-error
    where: { diamondCategory: { equals: categoryId } },
    sort: "-ctBandMax",
    limit: 1,
  });
  if (last.docs.length === 0) {
    throw new Error(
      `No rate-diamond entries for category id=${categoryId}. Run 'pnpm seed:rates'.`,
    );
  }
  return (last.docs[0] as unknown as { ratePerCt: number }).ratePerCt;
}

async function getColorStoneRate(
  payload: Payload,
  stoneId: string | number,
): Promise<{ rate: number; name: string }> {
  const stone = (await payload.findByID({
    collection: "color-stones",
    id: stoneId,
  })) as unknown as { ratePerCt: number; name: string };
  return { rate: stone.ratePerCt, name: stone.name };
}

function purityToMetalType(purity: Purity): "gold" | "silver" | "platinum" {
  if (purity === "Silver925") return "silver";
  if (purity === "Platinum") return "platinum";
  return "gold"; // 9K / 14K / 18K / 22K
}

async function getMakingRule(
  payload: Payload,
  metalType: "gold" | "silver" | "platinum",
) {
  const r = await payload.find({
    collection: "making-rules",
    // @ts-expect-error
    where: { metalType: { equals: metalType } },
    limit: 1,
  });
  if (r.docs.length === 0) {
    // Conservative fallback if no rule is set yet.
    return { type: "wastage_plus_making", wastagePct: 8, makingPerG: 3000, minMaking: 0 };
  }
  return r.docs[0] as unknown as {
    type: "wastage_plus_making" | "flat";
    wastagePct: number;
    makingPerG: number;
    minMaking: number;
  };
}

export async function computeProductPrice(
  payload: Payload,
  input: PricingInput,
): Promise<PriceBreakup> {
  const { product, metalPurity, diamondCategorySlug, solitaireCarat, ringSize } = input;

  // ─── METAL ────────────────────────────────────────────────────────────
  const metalEntry = product.metals?.find((m) => m.purity === metalPurity);
  if (!metalEntry) {
    throw new Error(
      `Product ${product.code} has no metal recipe for purity=${metalPurity}. Available: ${
        product.metals?.map((m) => m.purity).join(", ") ?? "(none)"
      }`,
    );
  }
  const goldRate = await getGoldRate(payload, metalPurity);
  const metalCost = metalEntry.weightG * goldRate;

  // ─── DIAMONDS ─────────────────────────────────────────────────────────
  const diamondCategoryId = await getDiamondCategoryId(payload, diamondCategorySlug);
  const diamondComponents: PriceBreakup["components"]["diamonds"] = [];
  let diamondCost = 0;
  for (const d of product.diamonds ?? []) {
    let effectiveCt = d.weightCt;
    if (product.isSolitaire && d.role === "solitaire" && solitaireCarat && solitaireCarat > 0) {
      effectiveCt = solitaireCarat * d.count; // scale total weight by chosen carat × count
    }
    const ratePerCt = await getDiamondRate(payload, diamondCategoryId, effectiveCt / Math.max(1, d.count));
    // ^ band lookup is by per-stone weight, not total; for small pavé it doesn't matter
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

  // ─── COLOR STONES ─────────────────────────────────────────────────────
  const colorStoneComponents: PriceBreakup["components"]["colorStones"] = [];
  let colorStoneCost = 0;
  for (const cs of product.colorStones ?? []) {
    const stoneId =
      typeof cs.stone === "string" || typeof cs.stone === "number" ? cs.stone : cs.stone.id;
    const { rate, name } = await getColorStoneRate(payload, stoneId);
    const cost = cs.weightCt * rate;
    colorStoneCost += cost;
    colorStoneComponents.push({
      stone: name,
      weightCt: cs.weightCt,
      count: cs.count,
      ratePerCt: rate,
      cost: Math.round(cost),
    });
  }

  // ─── MAKING ───────────────────────────────────────────────────────────
  const metalType = purityToMetalType(metalPurity);
  const rule = await getMakingRule(payload, metalType);
  let makingCost: number;
  if (rule.type === "wastage_plus_making") {
    const wastageCost = metalEntry.weightG * (rule.wastagePct / 100) * goldRate;
    const makingFlat = metalEntry.weightG * rule.makingPerG;
    makingCost = Math.max(wastageCost + makingFlat, rule.minMaking ?? 0);
  } else {
    makingCost = Math.max(metalEntry.weightG * rule.makingPerG, rule.minMaking ?? 0);
  }

  // ─── TOTALS ───────────────────────────────────────────────────────────
  const subTotal = metalCost + diamondCost + colorStoneCost + makingCost;
  const gst = Math.round(subTotal * (GST_RATE_PCT / 100));
  const total = Math.round(subTotal + gst);

  const lineItems: PriceLineItem[] = [
    {
      label: `Metal (${metalPurity})`,
      detail: `${metalEntry.weightG.toFixed(3)}g × ₹${Math.round(goldRate).toLocaleString("en-IN")}/g`,
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
      detail: rule.type === "wastage_plus_making" ? `${rule.wastagePct}% wastage + ₹${rule.makingPerG}/g` : `₹${rule.makingPerG}/g (flat)`,
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
      metal: { purity: metalPurity, weightG: metalEntry.weightG, ratePerG: goldRate, cost: Math.round(metalCost) },
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
