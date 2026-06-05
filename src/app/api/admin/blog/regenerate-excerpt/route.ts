/**
 * POST /api/admin/blog/regenerate-excerpt
 *
 * Regenerate blog excerpt using Claude
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

    // Generate excerpt with Claude
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `Generate a concise 1-2 sentence excerpt (max 100 chars) for a blog post with this title: "${title}".

          The excerpt should be engaging, summarize the key value, and encourage clicks.

          Respond with ONLY the excerpt text, no quotes or formatting.`,
        },
      ],
    });

    const excerpt =
      message.content[0].type === "text"
        ? message.content[0].text.trim()
        : "Check out this blog post.";

    return Response.json({
      ok: true,
      excerpt,
    });
  } catch (error) {
    console.error("[regenerate-excerpt] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
