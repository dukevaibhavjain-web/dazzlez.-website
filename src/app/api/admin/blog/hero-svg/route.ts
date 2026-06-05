/**
 * POST /api/admin/blog/hero-svg
 *
 * Generate hero SVG for blog post using Claude
 * Admin-only endpoint
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { generateHeroSvg } from "@/lib/blog/contentGeneration";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });

    // Admin-only
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, category = "General" } = await req.json();

    if (!title) {
      return Response.json({ error: "title required" }, { status: 400 });
    }

    console.log(`[hero-svg] Generating SVG for: "${title}"`);

    const svg = await generateHeroSvg(title, category);

    if (!svg) {
      return Response.json(
        { error: "Failed to generate SVG" },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      svg,
    });
  } catch (error) {
    console.error("[hero-svg] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
