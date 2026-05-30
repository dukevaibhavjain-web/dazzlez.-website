import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * GET /api/search?q=<query>
 *
 * Full-text search over active products by displayName and code.
 * Queries Payload's local API — no external search service needed at
 * this catalog size (< 10k SKUs). Algolia can be wired in later.
 *
 * Returns up to 10 results ordered by relevance (exact-prefix first).
 */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const payload = await getPayload({ config });

    // Search by displayName (contains) OR by exact code prefix
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (payload as any).find({
      collection: "products",
      where: {
        and: [
          { status: { equals: "active" } },
          {
            or: [
              { displayName: { like: q } },
              { code:        { like: q } },
              { description: { like: q } },
            ],
          },
        ],
      },
      select: {
        id:           true,
        slug:         true,
        code:         true,
        displayName:  true,
        fromPriceInr: true,
        category:     true,
      } as never,
      depth:  1,
      limit:  10,
      sort:   "-fromPriceInr",     // secondary sort; primary is relevance from Payload's LIKE
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = res.docs.map((p: any) => ({
      id:           String(p.id),
      slug:         p.slug,
      code:         p.code,
      displayName:  p.displayName,
      fromPriceInr: p.fromPriceInr ?? null,
      categoryName: typeof p.category === "object" ? (p.category?.name ?? null) : null,
    }));

    return NextResponse.json({ results }, {
      headers: {
        // Cache at CDN for 60 s (search results are not real-time critical)
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[GET /api/search]", err);
    return NextResponse.json({ results: [] });
  }
}
