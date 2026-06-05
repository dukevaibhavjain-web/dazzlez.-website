/**
 * Keyword discovery pipeline
 * Extract keywords from product catalog + expand with Claude
 */

import { Anthropic } from "@anthropic-ai/sdk";
import type { Payload } from "payload";

export type KeywordResult = {
  keyword: string;
  searchIntent: "informational" | "transactional" | "navigational" | "commercial";
  volume: "high" | "medium" | "low";
  difficulty: "high" | "medium" | "low";
  source: "product_catalog" | "ai_expanded";
};

/**
 * Extract raw keywords from product catalog
 * Gets category names, product names, occasion names
 */
export async function extractCatalogKeywords(payload: Payload): Promise<string[]> {
  const keywords = new Set<string>();

  try {
    // Fetch categories
    const categories = await payload.find({
      collection: "categories",
      select: { name: true },
      limit: 100,
      depth: 0,
    });

    for (const cat of categories.docs) {
      const name = (cat as any).name as string;
      if (name) {
        keywords.add(name.toLowerCase());
        // Add gifting variants
        keywords.add(`${name.toLowerCase()} gifting`);
        keywords.add(`${name.toLowerCase()} gift ideas`);
        keywords.add(`best ${name.toLowerCase()} as gift`);
      }
    }

    // Fetch occasions
    const occasions = await payload.find({
      collection: "occasions",
      select: { name: true },
      limit: 100,
      depth: 0,
    });

    for (const occ of occasions.docs) {
      const name = (occ as any).name as string;
      if (name) {
        keywords.add(name.toLowerCase());
        keywords.add(`${name.toLowerCase()} gift`);
        keywords.add(`${name.toLowerCase()} gift ideas`);
      }
    }

    // Fetch products (limited sample for keyword extraction)
    const products = await payload.find({
      collection: "products",
      select: { displayName: true },
      limit: 200,
      depth: 0,
    });

    for (const prod of products.docs) {
      const displayName = (prod as any).displayName as string;
      if (displayName) {
        keywords.add(displayName.toLowerCase());
      }
    }
  } catch (error) {
    console.error("[keywordDiscovery] Error extracting catalog keywords:", error);
  }

  return Array.from(keywords);
}

/**
 * Expand keywords with Claude
 * Adds gifting angles, occasion-based keywords, style variants
 */
export async function expandKeywordsWithClaude(
  rawKeywords: string[],
  category: string
): Promise<KeywordResult[]> {
  const client = new Anthropic();

  const keywordList = rawKeywords.slice(0, 50).join(", "); // Limit to 50 for token efficiency

  const prompt = `You are an SEO expert for a lab-grown diamond jewelry store in India.

Given these seed keywords from our catalog:
${keywordList}

For the category: ${category}

Generate 20 new, high-quality keywords covering:
1. Gifting occasions (anniversary gift, birthday gift for wife, engagement gift ideas)
2. Style descriptors (minimalist diamond ring, statement jewelry, everyday wear)
3. Price-intent queries (diamond ring under 50000, affordable lab grown rings)
4. Comparison queries (lab grown vs natural diamond, why buy lab grown)
5. Location/cultural terms (BIS hallmarked jewelry, hallmark gold ring)
6. Quality terms (certified diamond jewelry, authentic lab grown)

Return ONLY a valid JSON array with no markdown formatting:
[
  {"keyword": "string", "searchIntent": "informational|transactional|navigational|commercial", "volume": "high|medium|low", "difficulty": "high|medium|low"},
  ...
]`;

  try {
    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      console.error("[expandKeywords] Unexpected response type");
      return [];
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[expandKeywords] No JSON found in response");
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      keyword: string;
      searchIntent: string;
      volume: string;
      difficulty: string;
    }>;

    return parsed.map((item) => ({
      keyword: item.keyword,
      searchIntent: (item.searchIntent as any) || "informational",
      volume: (item.volume as any) || "medium",
      difficulty: (item.difficulty as any) || "medium",
      source: "ai_expanded" as const,
    }));
  } catch (error) {
    console.error("[expandKeywords] Claude error:", error);
    return [];
  }
}

/**
 * Deduplicate and rank keywords
 * Remove near-duplicates, rank by SEO value
 */
export function deduplicateAndRank(
  keywords: KeywordResult[],
  maxKeywords = 100
): KeywordResult[] {
  // Simple dedup: exact lowercase match
  const seen = new Map<string, KeywordResult>();

  for (const kw of keywords) {
    const normalized = kw.keyword.toLowerCase().trim();
    if (!seen.has(normalized)) {
      seen.set(normalized, kw);
    }
  }

  // Rank by: transactional intent > high volume > low difficulty
  const ranked = Array.from(seen.values()).sort((a, b) => {
    const scoreA = scoreKeyword(a);
    const scoreB = scoreKeyword(b);
    return scoreB - scoreA;
  });

  return ranked.slice(0, maxKeywords);
}

function scoreKeyword(kw: KeywordResult): number {
  let score = 0;

  // Intent: transactional is highest value
  if (kw.searchIntent === "transactional") score += 100;
  if (kw.searchIntent === "commercial") score += 80;
  if (kw.searchIntent === "informational") score += 40;
  if (kw.searchIntent === "navigational") score += 20;

  // Volume
  if (kw.volume === "high") score += 50;
  if (kw.volume === "medium") score += 25;
  if (kw.volume === "low") score += 10;

  // Difficulty (lower is better)
  if (kw.difficulty === "low") score += 40;
  if (kw.difficulty === "medium") score += 20;
  if (kw.difficulty === "high") score += 5;

  return score;
}
