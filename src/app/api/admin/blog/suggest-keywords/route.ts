/**
 * POST /api/admin/blog/suggest-keywords
 *
 * Suggest related keywords for a blog post
 * Admin-only endpoint
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { Anthropic } from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blogId, title } = await req.json();

    if (!blogId || !title) {
      return Response.json(
        { error: "blogId and title required" },
        { status: 400 }
      );
    }

    // Generate keyword suggestions with Claude
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Generate 5-8 SEO-friendly keywords for a blog post with this title: "${title}".

          Keywords should:
          - Be short phrases (1-3 words)
          - Have high search intent
          - Be relevant to jewelry/gifting industry
          - Be suitable for meta tags and internal linking

          Respond with ONLY a comma-separated list of keywords, no numbering or extra text.`,
        },
      ],
    });

    const keywordsText =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const keywords = keywordsText
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    return Response.json({
      ok: true,
      keywords,
    });
  } catch (error) {
    console.error("[suggest-keywords] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
