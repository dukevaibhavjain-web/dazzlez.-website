import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * POST /api/reviews
 *
 * Accepts a customer review submission.
 * The review is saved with `approved: false` so the admin must approve it
 * before it appears on the storefront.
 *
 * Body:
 *   productCode  string   — product SKU code (we resolve to the product ID)
 *   rating       number   — 1–5
 *   title        string
 *   body         string
 *   authorName   string
 *   verified     boolean  — true if customer indicates it's a verified purchase
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      productCode: string;
      rating: number;
      title: string;
      body: string;
      authorName: string;
      verified?: boolean;
    };

    const { productCode, rating, title, body: reviewBody, authorName, verified } = body;

    // ── Basic validation ────────────────────────────────────────────────
    if (!productCode || !rating || !title?.trim() || !reviewBody?.trim() || !authorName?.trim()) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: "Rating must be a whole number between 1 and 5." }, { status: 400 });
    }
    if (title.trim().length > 120) {
      return NextResponse.json({ error: "Title must be under 120 characters." }, { status: 400 });
    }
    if (reviewBody.trim().length > 2000) {
      return NextResponse.json({ error: "Review body must be under 2000 characters." }, { status: 400 });
    }

    const payload = await getPayload({ config });

    // ── Resolve product ─────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productRes = await (payload as any).find({
      collection: "products",
      where: { code: { equals: productCode } },
      limit: 1,
      depth: 0,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = productRes?.docs?.[0] as any;
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // ── Create review (pending approval) ───────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).create({
      collection: "reviews",
      overrideAccess: true,
      data: {
        product:    product.id,
        rating,
        title:      title.trim(),
        body:       reviewBody.trim(),
        authorName: authorName.trim(),
        reviewDate: new Date().toISOString(),
        verified:   Boolean(verified),
        approved:   false,   // Admin must approve before it goes live
      },
    });

    return NextResponse.json({ ok: true, message: "Thank you for your review! It will appear after approval." });
  } catch (err) {
    console.error("[POST /api/reviews]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
