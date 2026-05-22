/**
 * Seed the default trust badges shown on the product page.
 * Safe to re-run — clears existing badges first.
 *
 *   pnpm seed:trust-badges
 */
import { getPayload } from "payload";
import config from "../src/payload.config.js";

const DEFAULTS = [
  {
    icon: "✦",
    label: "BIS Hallmarked",
    tooltip:
      "Every piece carries a BIS hallmark certifying gold purity — your assurance of genuine quality.",
    order: 1,
    active: true,
  },
  {
    icon: "✦",
    label: "IGI / GIA Certified",
    tooltip:
      "All diamonds come with an IGI or GIA certificate and full 4Cs disclosure (cut, colour, clarity, carat).",
    order: 2,
    active: true,
  },
  {
    icon: "✦",
    label: "Lifetime Buyback & Exchange",
    tooltip:
      "Exchange or sell back your Dazzlez jewellery at fair market value, any time — no questions asked.",
    order: 3,
    active: true,
  },
  {
    icon: "✦",
    label: "Insured Shipping & 30-day Returns",
    tooltip:
      "Every order ships fully insured. Not satisfied? Return within 30 days for a complete refund.",
    order: 4,
    active: true,
  },
];

async function main() {
  const payload = await getPayload({ config });

  // Delete all existing trust badges
  let page = 1;
  while (true) {
    const existing = await payload.find({
      collection: "trust-badges",
      limit: 100,
      page,
      depth: 0,
    });
    for (const doc of existing.docs) {
      await payload.delete({ collection: "trust-badges", id: doc.id });
    }
    if (page >= existing.totalPages) break;
  }

  // Create defaults
  for (const badge of DEFAULTS) {
    await payload.create({ collection: "trust-badges", data: badge });
  }

  console.log(`✅ Seeded ${DEFAULTS.length} trust badges.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ seed:trust-badges failed:", err);
  process.exit(1);
});
