/**
 * POST /api/admin/blog/approve-keyword
 *
 * Approve a keyword for content generation
 * Admin-only endpoint
 */

import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keywordId } = await req.json();

    if (!keywordId) {
      return Response.json({ error: "keywordId required" }, { status: 400 });
    }

    const updated = await payload.update({
      collection: "keyword-bank",
      id: keywordId,
      data: {
        status: "approved",
      },
    });

    return Response.json({
      ok: true,
      keyword: updated,
    });
  } catch (error) {
    console.error("[approve-keyword] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
