/**
 * Seed FAQ content for the PDP FAQ accordion.
 * Covers lab diamonds, pricing, returns, shipping, and general jewellery care.
 * Safe to re-run — clears existing FAQs first.
 *
 *   pnpm seed:faqs
 */
import { getPayload } from "payload";
import config from "../src/payload.config.js";

const FAQS = [
  // ─── Lab Diamonds ─────────────────────────────────────────────────────────
  {
    category: "diamonds",
    order: 1,
    question: "Are lab-grown diamonds real diamonds?",
    answer:
      "Yes — lab-grown diamonds are 100% real diamonds. They have the exact same physical, chemical, and optical properties as mined diamonds. Both are pure carbon crystals with the same atomic structure, hardness (10 on the Mohs scale), and sparkle. The only difference is origin: lab diamonds grow in a controlled environment over a few weeks rather than deep underground over millions of years. A gemologist cannot tell them apart without specialist equipment.",
  },
  {
    category: "diamonds",
    order: 2,
    question: "What is the difference between lab-grown and natural diamonds?",
    answer:
      "Lab-grown and natural diamonds are chemically and optically identical. The key differences are: (1) Origin — lab diamonds are created in 6–10 weeks; natural diamonds form over millions of years. (2) Cost — lab diamonds are typically 30–50% more affordable, because production is faster and supply is more consistent. (3) Environmental impact — lab diamonds require no large-scale mining, significantly reducing land disturbance and carbon footprint. From a quality and beauty standpoint, they are indistinguishable.",
  },
  {
    category: "diamonds",
    order: 3,
    question: "Are Dazzlez diamonds certified?",
    answer:
      "Yes. All our diamonds — both lab-grown and natural — are certified by internationally recognised gemological laboratories such as IGI (International Gemological Institute) and GIA (Gemological Institute of America). Every certificate details the diamond's carat weight, colour, clarity, and cut grade. Your certificate number is verifiable directly on the issuing lab's website.",
  },
  {
    category: "diamonds",
    order: 4,
    question: "What are the 4 Cs of diamonds?",
    answer:
      "The 4 Cs are the global standard for evaluating a diamond's quality:\n\n• Carat — the weight of the diamond. 1 carat = 0.2 grams.\n• Colour — graded D (colourless) to Z (light yellow). Our lab diamonds typically fall in the D–F (colourless) range.\n• Clarity — measures internal inclusions and surface blemishes. Grades range from FL (Flawless) to I3. Most of our lab diamonds are VVS–VS quality.\n• Cut — the quality of the cut determines how much a diamond sparkles. We stock Excellent and Very Good cut grades as standard.\n\nA well-cut diamond will outshine a higher-colour or higher-clarity stone that is poorly cut.",
  },
  {
    category: "diamonds",
    order: 5,
    question: "Why are lab-grown diamonds less expensive than mined diamonds?",
    answer:
      "Three main reasons: (1) Production speed — a lab diamond grows in weeks, not millions of years, so the supply chain is far shorter. (2) No mining — there are no heavy excavation costs, no large workforces, and no environmental remediation expenses. (3) Consistent supply — labs can produce diamonds year-round to meet demand, which keeps prices stable. The savings go directly to you without any compromise on quality, certification, or beauty.",
  },

  // ─── Pricing ──────────────────────────────────────────────────────────────
  {
    category: "pricing",
    order: 6,
    question: "How is the price of a Dazzlez piece calculated?",
    answer:
      "Every price is built up transparently from four components:\n\n1. Metal cost — live market price of gold (per gram) × the weight of your piece.\n2. Diamond cost — carat weight × per-carat rate for the quality grade.\n3. Making charges — craftsmanship labour, typically 15–20% of the metal + diamond cost.\n4. GST — 3% on the total.\n\nYou can see a full itemised breakdown for any piece by expanding the 'Price Breakup' accordion on the product page.",
  },
  {
    category: "pricing",
    order: 7,
    question: "Can I choose Natural vs Lab-Grown diamonds on the same design?",
    answer:
      "Yes — every product page shows three price tiers side by side: Natural Diamond, Lab Grown Premium, and Lab Grown Standard. You can switch between them instantly and see the price update in real time. This transparency is at the core of how Dazzlez works — you choose the option that fits your budget and values.",
  },
  {
    category: "pricing",
    order: 8,
    question: "Do prices change over time?",
    answer:
      "Gold rates and diamond rates are updated regularly to reflect market movements. The price shown on the product page is an estimate based on current rates. For made-to-order pieces, the final invoice is issued at dispatch and may vary slightly if rates have moved during the crafting period (typically 10–14 days). We will always inform you before proceeding if there is a meaningful change.",
  },

  // ─── Returns & Exchange ───────────────────────────────────────────────────
  {
    category: "returns",
    order: 9,
    question: "What is your return policy?",
    answer:
      "We offer a 30-day hassle-free return policy. If you are not completely satisfied with your purchase, return it in its original, unworn condition within 30 days and we will issue a full refund. Return shipping is arranged by our team via insured courier — you just need to hand it over.",
  },
  {
    category: "returns",
    order: 10,
    question: "Can I exchange my jewellery for a different size or design?",
    answer:
      "Absolutely. Dazzlez offers a lifetime exchange on all pieces. You can exchange any item at any time for a different design or size — no expiry, no questions. If you are upgrading to a higher-value piece, you simply pay the difference based on current rates. Our team will guide you through the process on WhatsApp.",
  },
  {
    category: "returns",
    order: 11,
    question: "Do you offer a buyback guarantee?",
    answer:
      "Yes — we offer a lifetime buyback on all Dazzlez pieces. If you ever wish to sell your jewellery back to us, we will buy it at fair market value based on current gold and diamond rates at the time of return. Contact us on WhatsApp to initiate a buyback and we will provide a quote within 24 hours.",
  },

  // ─── Shipping ─────────────────────────────────────────────────────────────
  {
    category: "shipping",
    order: 12,
    question: "How is my order packaged and shipped?",
    answer:
      "Every Dazzlez order is packed in a premium branded gift box with protective padding, then sealed in a tamper-evident shipping box. Orders are dispatched via insured courier (typically FedEx or DTDC) with full value insurance against loss or damage in transit. You receive a tracking link by SMS and email as soon as the order is dispatched.",
  },
  {
    category: "shipping",
    order: 13,
    question: "How long does delivery take?",
    answer:
      "For made-to-order pieces (most of our catalogue), crafting takes approximately 10–14 days. Once dispatched, delivery within India takes 3–5 business days. You will receive a video of your finished piece before it is dispatched. Ready-stock items ship within 1–2 business days of order confirmation.",
  },
  {
    category: "shipping",
    order: 14,
    question: "Do you ship internationally?",
    answer:
      "Yes, we ship worldwide. International orders typically take 10–15 business days after dispatch and are fully insured. Customs duties, taxes, and import fees applicable in your country are the customer's responsibility. For international orders, please reach out to our team on WhatsApp for a custom shipping quote before placing your order.",
  },

  // ─── General / Care ───────────────────────────────────────────────────────
  {
    category: "general",
    order: 15,
    question: "How do I care for my diamond jewellery?",
    answer:
      "Lab diamonds require the same care as mined diamonds:\n\n• Clean gently with a soft brush, warm water, and a drop of mild dish soap. Rinse and pat dry.\n• Avoid harsh chemicals — chlorine, bleach, and acetone can damage metal settings.\n• Remove your jewellery before swimming, exercising, or doing household chores.\n• Store each piece separately in its pouch or box to prevent scratching.\n• Bring it in for a complimentary professional clean once a year.\n\nWith proper care, your Dazzlez piece will last a lifetime.",
  },
  {
    category: "general",
    order: 16,
    question: "Is lab-grown diamond jewellery a good investment?",
    answer:
      "Lab diamond jewellery offers excellent value. You receive the same beauty, durability, and certification as a natural diamond piece at 30–50% less cost — which means more design or carat weight for your budget. Lab diamonds do not appreciate in value the way rare collectibles do, but neither do most mined diamonds at retail. The real value is in the craftsmanship, the emotional significance of the piece, and the confidence that comes from transparent, fair pricing. Our lifetime buyback further protects your investment.",
  },
  {
    category: "general",
    order: 17,
    question: "Can I customise my jewellery?",
    answer:
      "Yes — fully. You can customise metal type (9K, 14K, 18K, or 22K gold in yellow, white, or rose; 925 silver; or platinum), diamond carat and quality, ring size, and engraving (up to 20 characters, free of charge). For more significant design modifications — adding stones, changing a setting style, or creating a bespoke piece from scratch — message our design team on WhatsApp and we will walk you through the options.",
  },
  {
    category: "general",
    order: 18,
    question: "Is engraving free, and what can I engrave?",
    answer:
      "Engraving is completely free on all Dazzlez pieces. You can engrave up to 20 characters — names, dates, initials, or a short message — inside the band or on a flat surface of the piece. Engraving is done during the crafting process and cannot be changed afterwards, so please double-check spellings before submitting. You can add your engraving text in the 'Engraving' field on the product page.",
  },
];

async function main() {
  const payload = await getPayload({ config });

  // Clear existing FAQs
  let page = 1;
  while (true) {
    const existing = await payload.find({ collection: "faqs", limit: 100, page, depth: 0 });
    for (const doc of existing.docs) {
      await payload.delete({ collection: "faqs", id: doc.id });
    }
    if (page >= existing.totalPages) break;
  }

  // Create new FAQs
  for (const faq of FAQS) {
    await payload.create({ collection: "faqs", data: { ...faq, active: true } });
  }

  console.log(`✅ Seeded ${FAQS.length} FAQs.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ seed:faqs failed:", err);
  process.exit(1);
});
