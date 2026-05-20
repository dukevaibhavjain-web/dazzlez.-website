/**
 * Seed initial rates from your input (2026-05 placeholders).
 *
 * Inputs:
 *   - 24K gold @ ₹162,500/10g = ₹16,250/g  (Jaipur)
 *   - USD/INR @ ₹85 (FX rate placeholder)
 *   - Natural G/SI base diamond rate: $2000/ct for 0-1ct band
 *   - Premium Lab Grown: 10% of Natural   (i.e. 1/10th)
 *   - Standard Lab Grown: 8% of Natural   (i.e. 8/100ths)
 *   - Slabs above 1ct: +15% per 1ct band (cumulative — 1-2ct is 1.15x, 2-3ct is 1.15², etc.)
 *
 * All values are placeholders and admin-editable. Idempotent — re-run safe.
 *
 * Run: pnpm seed:rates
 */
import { getPayload } from "payload";
import config from "../src/payload.config.js";

const USD_TO_INR = 85;
const GOLD_24K_PER_G = 16250; // ₹162,500 per 10g
const PURITY_RATIO: Record<string, number> = {
  "9K": 0.375,
  "14K": 0.583,
  "18K": 0.75,
  "22K": 0.916,
};

const GOLD_RATES_INR_PER_G: Array<{ purity: string; ratePerG: number }> = [
  ...Object.entries(PURITY_RATIO).map(([purity, ratio]) => ({
    purity,
    ratePerG: Math.round(GOLD_24K_PER_G * ratio),
  })),
  { purity: "Silver925", ratePerG: 300 },
  { purity: "Platinum", ratePerG: 3500 },   // placeholder, please adjust
];

const DIAMOND_CATEGORIES = [
  {
    name: "Natural",
    slug: "natural",
    description: "Mined natural diamond, IGI / GIA certified.",
    displayOrder: 10,
    baseMultiplier: 1.0,
  },
  {
    name: "Lab Grown Premium",
    slug: "lab-premium",
    description: "Top-grade lab grown diamond — 10% of Natural rate.",
    displayOrder: 20,
    baseMultiplier: 0.10,
  },
  {
    name: "Lab Grown Standard",
    slug: "lab-standard",
    description: "Standard-grade lab grown diamond — 8% of Natural rate.",
    displayOrder: 30,
    baseMultiplier: 0.08,
  },
];

const NATURAL_BASE_USD_PER_CT = 2000;       // $2000/ct for 0-1ct natural G/SI
const SLAB_INCREMENT_PCT = 0.15;            // +15% per 1ct slab above 1ct
const NUM_SLABS = 5;                        // 0-1, 1-2, 2-3, 3-4, 4-5 ct

const COLOR_STONES = [
  { name: "Ruby", slug: "ruby", grade: "Standard", ratePerCt: 8000, notes: "Default rate — adjust in admin." },
  { name: "Emerald", slug: "emerald", grade: "Standard", ratePerCt: 10000, notes: "" },
  { name: "Blue Sapphire", slug: "blue-sapphire", grade: "Standard", ratePerCt: 7000, notes: "" },
  { name: "Pearl", slug: "pearl", grade: "Standard", ratePerCt: 500, notes: "" },
  { name: "Tanzanite", slug: "tanzanite", grade: "Standard", ratePerCt: 4500, notes: "" },
];

const MAKING_RULES_BY_METAL: Array<{
  metalType: "gold" | "silver" | "platinum";
  type: "wastage_plus_making" | "flat";
  wastagePct: number;
  makingPerG: number;
  minMaking: number;
}> = [
  { metalType: "gold", type: "wastage_plus_making", wastagePct: 8, makingPerG: 3000, minMaking: 0 },
  { metalType: "silver", type: "wastage_plus_making", wastagePct: 8, makingPerG: 1000, minMaking: 0 },
  { metalType: "platinum", type: "wastage_plus_making", wastagePct: 8, makingPerG: 3000, minMaking: 0 },
];

const FX_RATES = [
  { currency: "USD", inrPerUnit: USD_TO_INR },
  { currency: "AED", inrPerUnit: 23.13 },
  { currency: "GBP", inrPerUnit: 107.5 },
  { currency: "EUR", inrPerUnit: 92.2 },
  { currency: "SGD", inrPerUnit: 63.0 },
];

async function main() {
  const payload = await getPayload({ config });

  console.log("\n💰 Seeding rates...\n");
  const now = new Date().toISOString();

  // ─── Diamond Categories ────────────────────────────────────────────
  console.log("• Diamond Categories");
  const dcMap = new Map<string, string | number>();
  for (const dc of DIAMOND_CATEGORIES) {
    const existing = await payload.find({
      collection: "diamond-categories",
      where: { slug: { equals: dc.slug } },
      limit: 1,
    });
    if (existing.totalDocs > 0) {
      dcMap.set(dc.slug, existing.docs[0].id);
      console.log(`  - ${dc.name}: exists`);
      continue;
    }
    const created = await payload.create({
      collection: "diamond-categories",
      data: {
        name: dc.name,
        slug: dc.slug,
        description: dc.description,
        displayOrder: dc.displayOrder,
      },
    });
    dcMap.set(dc.slug, created.id);
    console.log(`  + ${dc.name}`);
  }

  // ─── Gold Rates ────────────────────────────────────────────────────
  console.log("• Gold Rates");
  for (const { purity, ratePerG } of GOLD_RATES_INR_PER_G) {
    const existing = await payload.find({
      collection: "rate-gold",
      where: { purity: { equals: purity } },
      limit: 1,
    });
    if (existing.totalDocs > 0) {
      console.log(`  - ${purity}: exists (₹${existing.docs[0].ratePerG}/g)`);
      continue;
    }
    await payload.create({
      collection: "rate-gold",
      data: {
        purity,
        ratePerG,
        source: "manual",
        effectiveAt: now,
        notes: "Seeded from initial config (24K = ₹162,500/10g @ Jaipur, 2026-05).",
      },
    });
    console.log(`  + ${purity}: ₹${ratePerG.toLocaleString("en-IN")}/g`);
  }

  // ─── Diamond Rate Matrix ───────────────────────────────────────────
  console.log("• Diamond Rate Matrix");
  for (const dc of DIAMOND_CATEGORIES) {
    const catId = dcMap.get(dc.slug)!;
    for (let i = 0; i < NUM_SLABS; i++) {
      const ctMin = i * 1.0;
      const ctMax = (i + 1) * 1.0;
      const slabMultiplier = Math.pow(1 + SLAB_INCREMENT_PCT, i);
      const usdRate = NATURAL_BASE_USD_PER_CT * dc.baseMultiplier * slabMultiplier;
      const inrRate = Math.round(usdRate * USD_TO_INR);

      const existing = await payload.find({
        collection: "rate-diamond",
        where: {
          and: [
            { diamondCategory: { equals: catId } },
            { ctBandMin: { equals: ctMin } },
            { ctBandMax: { equals: ctMax } },
          ],
        },
        limit: 1,
      });
      if (existing.totalDocs > 0) continue;

      await payload.create({
        collection: "rate-diamond",
        data: {
          diamondCategory: catId,
          ctBandMin: ctMin,
          ctBandMax: ctMax,
          ratePerCt: inrRate,
          effectiveAt: now,
        },
      });
    }
    console.log(`  + ${dc.name}: ${NUM_SLABS} bands (0→${NUM_SLABS}ct)`);
  }

  // ─── Color Stones ──────────────────────────────────────────────────
  console.log("• Color Stones");
  for (const cs of COLOR_STONES) {
    const existing = await payload.find({
      collection: "color-stones",
      where: { slug: { equals: cs.slug } },
      limit: 1,
    });
    if (existing.totalDocs > 0) {
      console.log(`  - ${cs.name}: exists`);
      continue;
    }
    await payload.create({ collection: "color-stones", data: cs });
    console.log(`  + ${cs.name}: ₹${cs.ratePerCt.toLocaleString("en-IN")}/ct`);
  }

  // ─── Making Rules (per metal type) ─────────────────────────────────
  console.log("• Making Rules");
  for (const rule of MAKING_RULES_BY_METAL) {
    const existing = await payload.find({
      collection: "making-rules",
      where: { metalType: { equals: rule.metalType } },
      limit: 1,
    });
    if (existing.totalDocs > 0) {
      console.log(`  - ${rule.metalType}: exists`);
      continue;
    }
    await payload.create({
      collection: "making-rules",
      data: rule,
    });
    console.log(
      `  + ${rule.metalType}: ${rule.type} ${rule.wastagePct}% + ₹${rule.makingPerG.toLocaleString("en-IN")}/g`,
    );
  }

  // ─── FX Rates ──────────────────────────────────────────────────────
  console.log("• FX Rates");
  for (const fx of FX_RATES) {
    const existing = await payload.find({
      collection: "fx-rates",
      where: { currency: { equals: fx.currency } },
      limit: 1,
    });
    if (existing.totalDocs > 0) {
      console.log(`  - ${fx.currency}: exists`);
      continue;
    }
    await payload.create({
      collection: "fx-rates",
      data: { ...fx, source: "manual", effectiveAt: now },
    });
    console.log(`  + ${fx.currency}: ₹${fx.inrPerUnit}`);
  }

  console.log("\n✅ Rate seed complete.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Seed failed:");
  console.error(err);
  process.exit(1);
});
