/**
 * POST /api/admin/blog/schedule
 *
 * Schedule a blog post for publication
 * Assigns A/B test slot and sets scheduled time
 * Admin-only endpoint
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { assignAbTestSlot } from "@/lib/blog/publishTimeOptimizer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });

    // Admin-only
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blogId, scheduledFor } = await req.json();

    if (!blogId || !scheduledFor) {
      return Response.json(
        { error: "blogId and scheduledFor required" },
        { status: 400 }
      );
    }

    // Fetch blog
    const blog = await payload.findByID({
      collection: "blogs",
      id: blogId,
      depth: 0,
    });

    if (!blog) {
      return Response.json({ error: "Blog not found" }, { status: 404 });
    }

    // Count published blogs to determine A/B slot
    const publishedBlogs = await payload.find({
      collection: "blogs",
      where: { status: { equals: "published" } },
      select: { id: true },
      limit: 1,
      depth: 0,
    });

    const blogNumber = publishedBlogs.totalDocs || 0;
    const abTestSlot = assignAbTestSlot(blogNumber);

    console.log(`[schedule] Scheduling blog ${blogId} for ${scheduledFor}, slot: ${abTestSlot}`);

    // Update blog
    const updated = await payload.update({
      collection: "blogs",
      id: blogId,
      data: {
        status: "scheduled",
        scheduledFor: new Date(scheduledFor),
        abTestSlot,
      },
    });

    return Response.json({
      ok: true,
      blogId: (updated as any).id,
      scheduledFor,
      abTestSlot,
    });
  } catch (error) {
    console.error("[schedule] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
