/**
 * GET /api/admin/blog/keywords
 *
 * Fetch keyword bank entries with optional status filter
 * Admin-only endpoint
 */

import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "pending";

    const keywords = await payload.find({
      collection: "keyword-bank" as any,
      where: {
        status: { equals: status },
      },
      limit: 100,
      depth: 0,
    });

    return Response.json({
      ok: true,
      total: keywords.totalDocs,
      docs: keywords.docs,
    });
  } catch (error) {
    console.error("[keywords] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
