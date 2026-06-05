/**
 * GET /api/admin/analytics
 *
 * Returns aggregated analytics metrics from the Events collection.
 * Requires admin authentication.
 *
 * Metrics returned:
 * - Funnel: ViewContent, AddToCart, InitiateCheckout, Purchase counts
 * - Revenue: total revenue, order count, conversion rate, AOV
 * - Blog: blog views, engagement, top blogs, slot performance
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { calculateBlogMetrics } from "@/lib/blog/analyticsHelpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Check admin auth
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all events from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const eventsRes = await payload.find({
      collection: "events",
      where: {
        timestamp: {
          greater_than_equal: thirtyDaysAgo.toISOString(),
        },
      },
      limit: 10000,
      depth: 0,
    });

    const events = eventsRes.docs;

    // Calculate funnel metrics
    const funnelMetrics = {
      viewContent: countEventType(events, "ViewContent"),
      addToCart: countEventType(events, "AddToCart"),
      initiateCheckout: countEventType(events, "InitiateCheckout"),
      purchase: countEventType(events, "Purchase"),
    };

    // Calculate revenue metrics
    const purchaseEvents = events.filter((e) => e.eventName === "Purchase");
    const totalRevenue = purchaseEvents.reduce(
      (sum, e) => sum + ((e.eventData as any)?.revenue || 0),
      0
    );
    const totalOrders = purchaseEvents.length;
    const conversionRate =
      funnelMetrics.viewContent > 0
        ? funnelMetrics.purchase / funnelMetrics.viewContent
        : 0;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const revenueMetrics = {
      totalRevenue,
      totalOrders,
      conversionRate,
      aov,
    };

    // Fetch blog metrics
    const blogsRes = await payload.find({
      collection: "blogs" as any,
      where: { status: { equals: "published" } },
      limit: 1000,
      depth: 0,
    });

    const blogMetrics = await calculateBlogMetrics(events, blogsRes.docs);

    return Response.json({
      funnel: funnelMetrics,
      revenue: revenueMetrics,
      blog: blogMetrics,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[analytics/route]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

function countEventType(events: any[], eventName: string): number {
  return events.filter((e) => e.eventName === eventName).length;
}
