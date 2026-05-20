/**
 * Seed one test product so we can verify the pricing engine end-to-end.
 *
 * Creates TEST-001: a halo engagement ring with
 *   - 18K weight 3.25g (also has 14K 2.75g for variant pricing)
 *   - 1 round solitaire center (0.50ct)
 *   - 16 small round pavé (0.32ct total)
 *
 * isSolitaire=true, so customer can also pick 1ct / 2ct / 3ct variants.
 *
 * Run: pnpm seed:test-product
 */
import { getPayload } from "payload";
import config from "../src/payload.config.js";

async function main() {
  const payload = await getPayload({ config });

  const ringCat = await payload.find({
    collection: "categories",
    where: { slug: { equals: "rings" } },
    limit: 1,
  });
  if (ringCat.totalDocs === 0) {
    throw new Error("Run pnpm seed:taxonomy first.");
  }

  const haloSub = await payload.find({
    collection: "sub-categories",
    where: { slug: { equals: "halo" } },
    limit: 1,
  });

  const roundShape = await payload.find({
    collection: "shapes",
    where: { slug: { equals: "round" } },
    limit: 1,
  });

  const existing = await payload.find({
    collection: "products",
    where: { code: { equals: "TEST-001" } },
    limit: 1,
  });
  if (existing.totalDocs > 0) {
    console.log("TEST-001 already exists. Skipping.");
    process.exit(0);
  }

  const created = await payload.create({
    collection: "products",
    data: {
      code: "TEST-001",
      displayName: "Round Halo Engagement Ring",
      description:
        "A timeless halo engagement ring — round brilliant center stone surrounded by 16 pavé-set diamonds.",
      category: ringCat.docs[0].id,
      subCategory: haloSub.docs[0]?.id,
      primaryShape: roundShape.docs[0]?.id,
      isSolitaire: true,
      isRing: true,
      status: "active",
      metals: [
        { purity: "14K", weightG: 2.75 },
        { purity: "18K", weightG: 3.25 },
        { purity: "22K", weightG: 3.97 },
        { purity: "9K", weightG: 2.34 },
      ],
      diamonds: [
        {
          role: "solitaire",
          shape: roundShape.docs[0]?.id,
          sizeMm: "5.00*5.00",
          weightCt: 0.5,
          count: 1,
          cut: "Excellent",
          color: "G",
          clarity: "SI",
        },
        {
          role: "small",
          shape: roundShape.docs[0]?.id,
          sizeMm: "1.20*1.20",
          weightCt: 0.32,
          count: 16,
          cut: "VG",
          color: "G",
          clarity: "SI",
        },
      ],
      colorStones: [],
    },
  });

  console.log(`✅ Created product TEST-001 (id: ${created.id})`);
  console.log("\nTest with:");
  console.log("  GET /api/quote/TEST-001?metal=18K&diamond=natural");
  console.log("  GET /api/quote/TEST-001?metal=18K&diamond=lab-premium");
  console.log("  GET /api/quote/TEST-001?metal=14K&diamond=lab-standard");
  console.log("  GET /api/quote/TEST-001?metal=18K&diamond=natural&carat=2  (solitaire 2ct variant)");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
