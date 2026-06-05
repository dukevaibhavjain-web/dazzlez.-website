/**
 * GET /api/cron/publish-scheduled-blogs
 *
 * Vercel Cron Job: Publish scheduled blogs when scheduledFor time is reached
 * Secured with CRON_SECRET environment variable
 *
 * Usage in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/publish-scheduled-blogs",
 *     "schedule": "*/5 * * * *"  // Every 5 minutes
 *   }]
 * }
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });

    // Find all blogs scheduled for publication
    const now = new Date();

    const scheduledBlogs = await payload.find({
      collection: "blogs",
      where: {
        and: [
          { status: { equals: "scheduled" } },
          { scheduledFor: { less_than_equal: now.toISOString() } },
        ],
      },
      limit: 100,
      depth: 0,
    });

    console.log(
      `[publish-scheduled] Found ${scheduledBlogs.docs.length} blogs to publish`
    );

    if (scheduledBlogs.docs.length === 0) {
      return Response.json({ ok: true, published: 0 });
    }

    // Publish each blog
    const published = [];

    for (const blog of scheduledBlogs.docs) {
      try {
        const blogId = (blog as any).id;
        const slug = (blog as any).slug as string;
        const title = (blog as any).title as string;

        // Get current publishing history
        const existingHistory = (blog as any).publishingHistory || [];

        // Update blog: status → published, add to history
        const updated = await payload.update({
          collection: "blogs",
          id: blogId,
          data: {
            status: "published",
            publishedAt: now,
            publishingHistory: [
              ...existingHistory,
              {
                publishedAt: now,
                abTestSlot: (blog as any).abTestSlot,
                viewCount: (blog as any).viewCount || 0,
                engagementScore: 0, // Will be calculated later from analytics
              },
            ],
          },
          overrideAccess: true,
        });

        published.push({
          id: blogId,
          slug,
          title,
        });

        console.log(`[publish-scheduled] Published: ${title} (${slug})`);

        // Revalidate blog pages for this post
        revalidatePath(`/blog/${slug}`);
      } catch (error) {
        console.error(
          `[publish-scheduled] Error publishing blog ${(blog as any).id}:`,
          error
        );
      }
    }

    // Revalidate blog listing page
    revalidatePath("/blog");

    // Update blog timing settings with new publish count
    const allPublished = await payload.find({
      collection: "blogs",
      where: { status: { equals: "published" } },
      select: { id: true },
      limit: 1,
      depth: 0,
    });

    await payload.updateGlobal({
      slug: "blog-timing-settings",
      data: {
        publishedBlogCount: allPublished.totalDocs || 0,
      },
      overrideAccess: true,
    });

    return Response.json({
      ok: true,
      published: published.length,
      blogs: published,
    });
  } catch (error) {
    console.error("[publish-scheduled] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
