/**
 * POST /api/admin/blog/optimize-timing
 *
 * Analyze A/B test performance and recommend best publish time
 * Requires minimum 10 published blogs to generate recommendation
 * Admin-only endpoint
 */

import { getPayload } from "payload";
import config from "@payload-config";
import {
  computeSlotStats,
  generateTimingRecommendation,
} from "@/lib/blog/publishTimeOptimizer";

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

    // Check if we have enough published blogs
    const publishedBlogs = await payload.find({
      collection: "blogs",
      where: { status: { equals: "published" } },
      select: { id: true },
      limit: 1,
      depth: 0,
    });

    const blogCount = publishedBlogs.totalDocs || 0;

    if (blogCount < 10) {
      return Response.json(
        {
          error: `Need at least 10 published blogs for optimization (currently ${blogCount})`,
        },
        { status: 400 }
      );
    }

    console.log(`[optimize-timing] Analyzing ${blogCount} blogs for timing optimization`);

    // Compute stats per slot
    const stats = await computeSlotStats(payload);

    if (!stats || stats.length === 0) {
      return Response.json(
        { error: "No engagement data available yet" },
        { status: 400 }
      );
    }

    console.log(`[optimize-timing] Computed stats: ${JSON.stringify(stats)}`);

    // Generate recommendation
    const recommendation = await generateTimingRecommendation(stats);

    console.log(`[optimize-timing] Recommendation: ${recommendation.recommendedSlot}`);

    // Update BlogTimingSettings global
    const timingSettings = await payload.updateGlobal({
      slug: "blog-timing-settings",
      data: {
        recommendedSlot: recommendation.recommendedSlot,
        recommendationReason: recommendation.reason,
        lastAnalyzedAt: new Date(),
        publishedBlogCount: blogCount,
        slotStats: stats.map((s) => ({
          slot: s.slot,
          avgViews: Math.round(s.avgViews),
          avgScrollDepth: Math.round(s.avgScrollDepth * 10) / 10,
          avgTimeOnPage: Math.round(s.avgTimeOnPage),
          blogCount: s.blogCount,
        })),
      },
    });

    return Response.json({
      ok: true,
      recommendedSlot: recommendation.recommendedSlot,
      reason: recommendation.reason,
      stats: stats,
      publishedBlogCount: blogCount,
    });
  } catch (error) {
    console.error("[optimize-timing] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
