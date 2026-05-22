/**
 * Seed reviews for every product in the DB.
 *
 * Each product gets 3–5 reviews, mix of 4 and 5 stars (~75% five-star)
 * giving a per-product average of ~4.6–4.8.
 *
 * Dates are spread over the last 14 months to look organic.
 * Running this script twice is safe — it deletes existing seeded reviews first.
 *
 *   pnpm seed:reviews
 */
import { getPayload } from "payload";
import config from "../src/payload.config.js";

// ─── Review content pools ────────────────────────────────────────────────────

const NAMES = [
  "Priya Sharma", "Anjali Mehta", "Kavita Patel", "Sunita Joshi", "Nisha Gupta",
  "Meera Reddy", "Pooja Iyer", "Divya Nair", "Aarti Bhatt", "Swati Malhotra",
  "Deepika Raj", "Rekha Srinivasan", "Ananya Kapoor", "Shreya Verma", "Pallavi Das",
  "Ritu Agarwal", "Seema Bose", "Neha Chandra", "Vandana Khanna", "Usha Tiwari",
  "Rohan Mehta", "Arjun Kapoor", "Vikram Patel", "Suresh Sharma", "Rahul Gupta",
  "Kavya Nambiar", "Ishaan Bhattacharya", "Sonal Doshi", "Harsha Kini", "Tanya Sood",
  "Mira Jain", "Leela Krishnan", "Puja Banerjee", "Aditi Chawla", "Smita Nadkarni",
  "Girish Thakur", "Preethi Ramesh", "Nalini Prabhu", "Varsha Gokhale", "Hema Pillai",
];

const FIVE_STAR: { title: string; body: string }[] = [
  {
    title: "Absolutely stunning",
    body: "The craftsmanship is beyond what I expected. Every detail is perfect and the diamonds have incredible sparkle. Dazzlez has become my go-to jeweller.",
  },
  {
    title: "Perfect in every way",
    body: "Bought this as a gift and the reaction was priceless. The packaging is premium and the piece itself is stunning. The transparent pricing was what convinced me to try.",
  },
  {
    title: "Exceeded all expectations",
    body: "I was a little nervous ordering jewellery online but Dazzlez delivered perfectly. The piece looks even better in person. Fast shipping and beautifully packaged.",
  },
  {
    title: "My favourite piece now",
    body: "The quality is exceptional. The finish is flawless and the diamonds catch the light beautifully. I've received so many compliments since I started wearing this.",
  },
  {
    title: "Beautiful craftsmanship",
    body: "Third order from Dazzlez and they never disappoint. The lab-grown diamonds are beautiful and the transparent pricing builds real trust. Highly recommend.",
  },
  {
    title: "Worth every rupee",
    body: "Gifted this to my mother on her birthday and she was in tears. The piece is delicate yet substantial, and the gold colour is exactly as shown. Perfect.",
  },
  {
    title: "Sparkling and elegant",
    body: "I compared prices with several local jewellers and Dazzlez offered significantly better quality for the price. The itemised cost breakdown was a refreshing change.",
  },
  {
    title: "Exactly as described",
    body: "The piece arrived perfectly and the sparkle is gorgeous. The Dazzlez team on WhatsApp was very helpful throughout. Will order again for sure.",
  },
  {
    title: "Exceptional quality",
    body: "The attention to detail in this piece is remarkable. Every stone is perfectly set and the finish is immaculate. Will definitely be back for more.",
  },
  {
    title: "Highly recommend Dazzlez",
    body: "Beautiful piece that looks far more expensive than it is. The gold is rich in colour and the diamonds are bright. Very happy with my purchase.",
  },
  {
    title: "Gifted and loved instantly",
    body: "She absolutely loved it! The design is elegant and the build quality is solid. Happy to have found Dazzlez — won't shop elsewhere for jewellery now.",
  },
  {
    title: "Stunning design",
    body: "The piece is everything I hoped for and more. The diamonds are set so precisely and the overall finish is luxurious. Delivered in beautiful packaging.",
  },
  {
    title: "Great experience overall",
    body: "From ordering to delivery, everything was seamless. The WhatsApp team kept me updated at every step. The product quality is outstanding — looks even better in real life.",
  },
  {
    title: "Show-stopping piece",
    body: "Wore this to a wedding and got compliments from everyone. The craftsmanship is top-notch and the diamonds sparkle so beautifully. Definitely buying more.",
  },
  {
    title: "Perfect gift choice",
    body: "Gifted this for our anniversary and my wife was overjoyed. The packaging itself felt premium. The ring fits perfectly and looks gorgeous. Thank you Dazzlez!",
  },
];

const FOUR_STAR: { title: string; body: string }[] = [
  {
    title: "Lovely piece",
    body: "The piece is gorgeous and the quality is solid. Delivery took about 14 days which is expected for made-to-order. The wait was absolutely worth it.",
  },
  {
    title: "Great quality overall",
    body: "Really happy with this purchase. The diamonds sparkle beautifully and the metal finish is excellent. Minor packaging scuff on delivery but the product itself is perfect.",
  },
  {
    title: "Beautiful design",
    body: "Beautiful craftsmanship and the design is elegant. Giving 4 stars only because I expected slightly larger stones but still very happy with the purchase overall.",
  },
  {
    title: "Very satisfied",
    body: "Nice piece for the price. The gold colour is consistent and the diamonds look great. The WhatsApp team was very responsive and kept me updated throughout.",
  },
  {
    title: "Good value for money",
    body: "Solid quality and lovely design. The packaging is premium which made it easy to gift. Would have given 5 stars but delivery was a day later than promised.",
  },
  {
    title: "Pleased with the purchase",
    body: "The piece is well-made and looks great. Quality is better than I expected at this price. Slight delay in delivery but the Dazzlez team communicated proactively.",
  },
  {
    title: "Looks great in person",
    body: "The photos don't do it justice — it looks even better in real life. The diamonds are bright and well-set. Happy with the purchase overall.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Simple deterministic number 0–(max-1) derived from index and offset. */
function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

/** Return a date between 14 months ago and 1 month ago. */
function pastDate(seed: number): string {
  const now = Date.now();
  const oneMonth = 30 * 24 * 60 * 60 * 1000;
  const fourteenMonths = 14 * oneMonth;
  // Spread reviews organically over the window
  const offset = ((seed * 7919) % fourteenMonths) + oneMonth; // prime scatter
  return new Date(now - Math.abs(offset)).toISOString();
}

/** Build review records for one product. */
function reviewsFor(productId: string | number, productIndex: number) {
  // 3, 4, or 5 reviews based on product index
  const counts = [3, 4, 5, 4, 3, 5, 4, 3, 4, 5];
  const count = counts[productIndex % counts.length];

  const result = [];
  for (let i = 0; i < count; i++) {
    const seed = productIndex * 31 + i * 17;
    // ~75% five-star, 25% four-star
    const isFiveStar = (seed % 4) !== 0;
    const template = isFiveStar
      ? pick(FIVE_STAR, seed + 3)
      : pick(FOUR_STAR, seed + 7);

    result.push({
      product: productId as number,
      rating: isFiveStar ? 5 : 4,
      title: template.title,
      body: template.body,
      authorName: pick(NAMES, seed + 11),
      reviewDate: pastDate(seed),
      verified: true,
      approved: true,
    });
  }
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const payload = await getPayload({ config });

  // 1. Fetch all products (paginated)
  console.log("📦 Loading all products…");
  const allProducts: Array<{ id: string | number; code: string }> = [];
  let page = 1;
  while (true) {
    const res = await payload.find({
      collection: "products",
      limit: 100,
      page,
      depth: 0,
      select: { id: true, code: true } as never,
    });
    for (const d of res.docs) {
      allProducts.push({ id: d.id, code: (d as unknown as { code: string }).code });
    }
    if (page >= res.totalPages) break;
    page++;
  }
  console.log(`   Found ${allProducts.length} products.\n`);

  // 2. Delete existing seeded reviews (idempotency)
  console.log("🗑  Clearing existing reviews…");
  let deleted = 0;
  let deletePage = 1;
  while (true) {
    const existing = await payload.find({
      collection: "reviews",
      limit: 100,
      page: deletePage,
      depth: 0,
    });
    for (const r of existing.docs) {
      await payload.delete({ collection: "reviews", id: r.id });
      deleted++;
    }
    if (deletePage >= existing.totalPages) break;
    // Don't increment page — after deletion the next page shifts
  }
  if (deleted > 0) console.log(`   Deleted ${deleted} existing reviews.\n`);

  // 3. Seed reviews
  console.log("✍️  Seeding reviews…");
  let created = 0;
  for (let i = 0; i < allProducts.length; i++) {
    const { id, code } = allProducts[i];
    const reviews = reviewsFor(id, i);
    for (const data of reviews) {
      await payload.create({ collection: "reviews", data });
      created++;
    }
    if ((i + 1) % 20 === 0) {
      process.stdout.write(`\r   ${i + 1}/${allProducts.length} products seeded (${created} reviews)…`);
    }
  }

  console.log(`\n\n✅ Done.`);
  console.log(`   Products seeded: ${allProducts.length}`);
  console.log(`   Reviews created: ${created}`);
  console.log(`   Avg per product: ${(created / allProducts.length).toFixed(1)}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ seed:reviews failed:");
  console.error(err);
  process.exit(1);
});
