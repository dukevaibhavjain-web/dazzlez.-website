/**
 * POST /api/admin/blog/discover-keywords
 *
 * Discover and generate keywords for blog content
 * Admin-only endpoint
 */

import { getPayload } from "payload";
import config from "@payload-config";
import {
  extractCatalogKeywords,
  expandKeywordsWithClaude,
  deduplicateAndRank,
} from "@/lib/blog/keywordDiscovery";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });

    // Admin-only
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category = "rings", count = 20 } = await req.json();

    // Step 1: Extract catalog keywords
    const catalogKeywords = await extractCatalogKeywords(payload);
    console.log(`[discover-keywords] Extracted ${catalogKeywords.length} catalog keywords`);

    // Step 2: Expand with Claude
    const expandedKeywords = await expandKeywordsWithClaude(catalogKeywords, category);
    console.log(`[discover-keywords] Expanded to ${expandedKeywords.length} keywords`);

    // Step 3: Deduplicate and rank
    const rankedKeywords = deduplicateAndRank(
      [...catalogKeywords.map((kw) => ({
        keyword: kw,
        searchIntent: "informational" as const,
        volume: "medium" as const,
        difficulty: "medium" as const,
        source: "product_catalog" as const,
      })), ...expandedKeywords],
      count
    );

    console.log(`[discover-keywords] Ranked to top ${count} keywords`);

    // Step 4: Insert into keyword-bank collection
    const inserted = [];
    const skipped = [];

    for (const kw of rankedKeywords) {
      try {
        // Check if keyword already exists
        const existing = await payload.find({
          collection: "keyword-bank",
          where: { keyword: { equals: kw.keyword } },
          limit: 1,
          depth: 0,
        });

        if (existing.docs.length > 0) {
          skipped.push(kw.keyword);
          continue;
        }

        // Create new keyword doc
        await payload.create({
          collection: "keyword-bank",
          data: {
            keyword: kw.keyword,
            searchIntent: kw.searchIntent,
            volume: kw.volume,
            difficulty: kw.difficulty,
            source: kw.source,
            approved: false,
          },
          overrideAccess: true,
        });

        inserted.push(kw.keyword);
      } catch (error) {
        console.error(`[discover-keywords] Error inserting keyword ${kw.keyword}:`, error);
        skipped.push(kw.keyword);
      }
    }

    return Response.json({
      ok: true,
      inserted: inserted.length,
      skipped: skipped.length,
      keywords: rankedKeywords.map((kw) => kw.keyword),
    });
  } catch (error) {
    console.error("[discover-keywords] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
