/**
 * GET /api/admin/blog/ready
 *
 * Fetch blogs ready to publish (pending_approval or scheduled)
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

    const blogs = await payload.find({
      collection: "blogs" as any,
      where: {
        or: [
          { status: { equals: "pending_approval" } },
          { status: { equals: "scheduled" } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        scheduledFor: true,
      },
      limit: 100,
      depth: 0,
    });

    return Response.json({
      ok: true,
      total: blogs.totalDocs,
      docs: blogs.docs,
    });
  } catch (error) {
    console.error("[ready] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
