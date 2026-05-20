/**
 * Seed initial taxonomy: categories, sub-categories, shapes, occasions.
 *
 * Idempotent — re-running won't duplicate. Existing entries are left alone;
 * new ones are added. Pulled from the design folder structure we already have
 * (R3 Trilogy, RH Halo, RP Pave, etc.) and the shape list from the homepage
 * mockup.
 *
 * Run with: pnpm seed:taxonomy
 */
import { getPayload } from "payload";
import config from "../src/payload.config.js";

type SeedItem = { name: string; slug: string; sortOrder: number };

const CATEGORIES: SeedItem[] = [
  { name: "Rings", slug: "rings", sortOrder: 10 },
  { name: "Earrings", slug: "earrings", sortOrder: 20 },
  { name: "Necklaces", slug: "necklaces", sortOrder: 30 },
  { name: "Pendants", slug: "pendants", sortOrder: 40 },
  { name: "Bracelets", slug: "bracelets", sortOrder: 50 },
  { name: "Bands", slug: "bands", sortOrder: 60 },
  { name: "Men's", slug: "mens", sortOrder: 70 },
];

const SUB_CATEGORIES: { category: string; items: SeedItem[] }[] = [
  {
    category: "rings",
    items: [
      { name: "Solitaire", slug: "solitaire", sortOrder: 10 },
      { name: "Halo", slug: "halo", sortOrder: 20 },
      { name: "Trilogy", slug: "trilogy", sortOrder: 30 },
      { name: "Pave", slug: "pave", sortOrder: 40 },
      { name: "Round Center", slug: "round-center", sortOrder: 50 },
      { name: "Wide Band", slug: "wide-band", sortOrder: 60 },
      { name: "5/7 Stone", slug: "five-seven-stone", sortOrder: 70 },
      { name: "Eternity", slug: "eternity", sortOrder: 80 },
      { name: "Engagement", slug: "engagement", sortOrder: 90 },
      { name: "Wedding", slug: "wedding", sortOrder: 100 },
      { name: "Cocktail", slug: "cocktail", sortOrder: 110 },
    ],
  },
  {
    category: "earrings",
    items: [
      { name: "Studs", slug: "studs", sortOrder: 10 },
      { name: "Hoops", slug: "hoops", sortOrder: 20 },
      { name: "Drops", slug: "drops", sortOrder: 30 },
      { name: "Danglers", slug: "danglers", sortOrder: 40 },
    ],
  },
  {
    category: "necklaces",
    items: [
      { name: "Pendant Necklace", slug: "pendant-necklace", sortOrder: 10 },
      { name: "Choker", slug: "choker", sortOrder: 20 },
      { name: "Layered", slug: "layered", sortOrder: 30 },
      { name: "Tennis", slug: "tennis", sortOrder: 40 },
      { name: "Statement", slug: "statement", sortOrder: 50 },
    ],
  },
  {
    category: "pendants",
    items: [
      { name: "Solitaire Pendant", slug: "solitaire-pendant", sortOrder: 10 },
      { name: "Halo Pendant", slug: "halo-pendant", sortOrder: 20 },
      { name: "Heart Pendant", slug: "heart-pendant", sortOrder: 30 },
      { name: "Cluster", slug: "cluster", sortOrder: 40 },
      { name: "Initial / Letter", slug: "initial", sortOrder: 50 },
    ],
  },
  {
    category: "bracelets",
    items: [
      { name: "Tennis Bracelet", slug: "tennis-bracelet", sortOrder: 10 },
      { name: "Cuff", slug: "cuff", sortOrder: 20 },
      { name: "Bangle", slug: "bangle", sortOrder: 30 },
      { name: "Chain", slug: "chain", sortOrder: 40 },
      { name: "Charm", slug: "charm", sortOrder: 50 },
    ],
  },
  {
    category: "bands",
    items: [
      { name: "Eternity Band", slug: "eternity-band", sortOrder: 10 },
      { name: "Wide Band", slug: "wide-band-bands", sortOrder: 20 },
      { name: "Stackable", slug: "stackable", sortOrder: 30 },
      { name: "Wedding Band", slug: "wedding-band", sortOrder: 40 },
    ],
  },
  {
    category: "mens",
    items: [
      { name: "Men's Ring", slug: "mens-ring", sortOrder: 10 },
      { name: "Men's Band", slug: "mens-band", sortOrder: 20 },
      { name: "Men's Pendant", slug: "mens-pendant", sortOrder: 30 },
      { name: "Men's Chain", slug: "mens-chain", sortOrder: 40 },
    ],
  },
];

const SHAPES: SeedItem[] = [
  { name: "Round", slug: "round", sortOrder: 10 },
  { name: "Oval", slug: "oval", sortOrder: 20 },
  { name: "Princess", slug: "princess", sortOrder: 30 },
  { name: "Pear", slug: "pear", sortOrder: 40 },
  { name: "Heart", slug: "heart", sortOrder: 50 },
  { name: "Cushion", slug: "cushion", sortOrder: 60 },
  { name: "Emerald", slug: "emerald", sortOrder: 70 },
  { name: "Marquise", slug: "marquise", sortOrder: 80 },
  { name: "Baguette", slug: "baguette", sortOrder: 90 },
  { name: "Radiant", slug: "radiant", sortOrder: 100 },
  { name: "Asscher", slug: "asscher", sortOrder: 110 },
];

const OCCASIONS: SeedItem[] = [
  { name: "Engagement", slug: "engagement", sortOrder: 10 },
  { name: "Wedding", slug: "wedding", sortOrder: 20 },
  { name: "Anniversary", slug: "anniversary", sortOrder: 30 },
  { name: "Birthday", slug: "birthday", sortOrder: 40 },
  { name: "Daily Wear", slug: "daily-wear", sortOrder: 50 },
  { name: "Gifting", slug: "gifting", sortOrder: 60 },
  { name: "Festive", slug: "festive", sortOrder: 70 },
];

async function upsertBySlug<T extends { slug: string }>(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: "categories" | "shapes" | "occasions",
  items: T[]
) {
  let inserted = 0;
  let skipped = 0;
  for (const item of items) {
    const existing = await payload.find({
      collection,
      where: { slug: { equals: item.slug } },
      limit: 1,
    });
    if (existing.totalDocs > 0) {
      skipped++;
      continue;
    }
    await payload.create({ collection, data: item as unknown as Record<string, unknown> });
    inserted++;
  }
  console.log(`  ${collection}: ${inserted} inserted, ${skipped} already existed`);
}

async function main() {
  const payload = await getPayload({ config });

  console.log("\n🌱 Seeding taxonomy...\n");

  console.log("• Categories");
  await upsertBySlug(payload, "categories", CATEGORIES);

  console.log("• Shapes");
  await upsertBySlug(payload, "shapes", SHAPES);

  console.log("• Occasions");
  await upsertBySlug(payload, "occasions", OCCASIONS);

  console.log("• Sub-categories");
  let subInserted = 0;
  let subSkipped = 0;
  for (const { category: categorySlug, items } of SUB_CATEGORIES) {
    const cat = await payload.find({
      collection: "categories",
      where: { slug: { equals: categorySlug } },
      limit: 1,
    });
    if (cat.totalDocs === 0) {
      console.warn(`    ⚠ Category ${categorySlug} not found, skipping its sub-categories`);
      continue;
    }
    const categoryId = cat.docs[0].id;
    for (const sub of items) {
      const existing = await payload.find({
        collection: "sub-categories",
        where: {
          and: [
            { slug: { equals: sub.slug } },
            { category: { equals: categoryId } },
          ],
        },
        limit: 1,
      });
      if (existing.totalDocs > 0) {
        subSkipped++;
        continue;
      }
      await payload.create({
        collection: "sub-categories",
        data: { ...sub, category: categoryId },
      });
      subInserted++;
    }
  }
  console.log(`  sub-categories: ${subInserted} inserted, ${subSkipped} already existed`);

  console.log("\n✅ Seed complete.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Seed failed:");
  console.error(err);
  process.exit(1);
});
