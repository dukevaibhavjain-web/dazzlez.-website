/**
 * Content generation pipeline
 * Keyword → Outline → Full blog post via Claude
 */

import { Anthropic } from "@anthropic-ai/sdk";
import type { Payload } from "payload";
import { blogToLexical, type LexicalEditorState } from "./lexicalConverter";

export type BlogOutline = {
  title: string;
  sections: Array<{ heading: string; wordTarget: number }>;
  faqs: string[];
  targetWordCount: number;
};

export type GeneratedBlogPost = {
  title: string;
  excerpt: string;
  intro: string;
  sections: Array<{ heading: string; content: string }>;
  conclusion: string;
  faq: Array<{ question: string; answer: string }>;
  metaDescription: string;
  focusKeyword: string;
  linkedProductCodes: string[];
  linkedCollectionSlugs: string[];
  body: LexicalEditorState;
};

type ProductSummary = {
  code: string;
  displayName: string;
  category: { slug: string; name: string };
  fromPriceInr: number | null;
};

/**
 * Generate blog outline from keyword
 * Calls Claude haiku for speed
 */
export async function generateOutline(
  keyword: string,
  category: string
): Promise<BlogOutline> {
  const client = new Anthropic();

  const prompt = `You are a content strategist for a luxury lab-grown diamond jewelry brand.

Keyword: "${keyword}"
Category: ${category}

Create a blog post outline targeting this keyword.
The tone should be: warm, expert, trustworthy, Indian English.

Return ONLY valid JSON (no markdown):
{
  "title": "Compelling H1 title incorporating the keyword",
  "sections": [
    {"heading": "H2 section heading", "wordTarget": 250},
    {"heading": "H2 section heading", "wordTarget": 250},
    {"heading": "H2 section heading", "wordTarget": 250},
    {"heading": "H2 section heading", "wordTarget": 250}
  ],
  "faqs": ["FAQ question 1?", "FAQ question 2?", "FAQ question 3?"],
  "targetWordCount": 1350
}`;

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
      throw new Error("Unexpected response type");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in outline response");
    }

    return JSON.parse(jsonMatch[0]) as BlogOutline;
  } catch (error) {
    console.error("[generateOutline] Error:", error);
    throw error;
  }
}

/**
 * Generate full blog post from outline
 * Calls Claude sonnet for quality
 */
export async function generateFullPost(
  outline: BlogOutline,
  products: ProductSummary[]
): Promise<GeneratedBlogPost> {
  const client = new Anthropic();

  const productContext = products
    .slice(0, 20) // Limit for token efficiency
    .map((p) => `- ${p.displayName} (₹${p.fromPriceInr || "Contact for price"}) - ${p.code}`)
    .join("\n");

  const prompt = `You are a jewelry content writer for The Dazzlez — lab-grown diamond jewelry brand in India.

Write a high-quality blog post following this outline:

Title: ${outline.title}
Target word count: ${outline.targetWordCount}
Sections: ${outline.sections.map((s) => `${s.heading} (≈${s.wordTarget} words)`).join(", ")}

Tone: warm, expert, trustworthy. Use Indian English (lakh, crore, gifting as verb).
Include the provided products naturally where contextually appropriate.

Available products (use .code for links):
${productContext}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "Blog title",
  "excerpt": "2-3 sentence summary for meta description",
  "intro": "2-3 paragraph introduction setting context",
  "sections": [
    {"heading": "Section heading", "content": "Full section content in 2-3 paragraphs"},
    ...
  ],
  "conclusion": "Closing paragraphs with CTA",
  "faq": [
    {"question": "Q1?", "answer": "Detailed answer"},
    ...
  ],
  "metaDescription": "155 character max SEO meta description",
  "focusKeyword": "The primary keyword this blog targets",
  "linkedProductCodes": ["CODE1", "CODE2"],
  "linkedCollectionSlugs": ["rings", "earrings"]
}`;

  try {
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in content response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as Omit<GeneratedBlogPost, "body">;

    // Convert to Lexical JSON
    const body = blogToLexical(
      parsed.intro,
      parsed.sections,
      parsed.conclusion,
      parsed.faq
    );

    return {
      ...parsed,
      body,
    };
  } catch (error) {
    console.error("[generateFullPost] Error:", error);
    throw error;
  }
}

/**
 * Resolve product codes to Payload IDs
 * Validates codes exist before returning
 */
export async function resolveLinkedProducts(
  productCodes: string[],
  payload: Payload
): Promise<number[]> {
  if (!productCodes || productCodes.length === 0) {
    return [];
  }

  try {
    const products = await payload.find({
      collection: "products",
      where: {
        code: {
          in: productCodes,
        },
      },
      select: { id: true, code: true },
      limit: 100,
      depth: 0,
    });

    return products.docs.map((doc: any) => doc.id as number);
  } catch (error) {
    console.error("[resolveLinkedProducts] Error:", error);
    return [];
  }
}

/**
 * Resolve collection slugs to Payload IDs
 */
export async function resolveLinkedCollections(
  slugs: string[],
  payload: Payload
): Promise<number[]> {
  if (!slugs || slugs.length === 0) {
    return [];
  }

  try {
    const categories = await payload.find({
      collection: "categories",
      where: {
        slug: {
          in: slugs,
        },
      },
      select: { id: true, slug: true },
      limit: 100,
      depth: 0,
    });

    return categories.docs.map((doc: any) => doc.id as number);
  } catch (error) {
    console.error("[resolveLinkedCollections] Error:", error);
    return [];
  }
}

/**
 * Generate hero SVG using Claude
 * Simple text-based SVG with styling
 */
export async function generateHeroSvg(
  title: string,
  category: string
): Promise<string> {
  const client = new Anthropic();

  const prompt = `Create a minimalist, elegant SVG (1200x630) for a jewelry blog hero image.

Blog Title: "${title}"
Category: ${category}

Design requirements:
- viewBox="0 0 1200 630"
- Navy (#001a33) background
- Gold (#D4AF37) accents
- Clean, modern aesthetic with subtle jewelry motifs (diamonds, lines)
- Title overlaid in center, large gold text
- Geometric patterns or minimalist jewelry shapes only

Return ONLY the SVG code, nothing else. Start with <svg and end with </svg>`;

  try {
    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const svgMatch = content.text.match(/<svg[\s\S]*<\/svg>/);
    if (!svgMatch) {
      console.warn("[generateHeroSvg] No SVG found in response, returning empty");
      return "";
    }

    return svgMatch[0];
  } catch (error) {
    console.error("[generateHeroSvg] Error:", error);
    return "";
  }
}
