/**
 * Blog Analytics Helpers
 * Aggregates engagement metrics from Events collection for blog performance analysis
 */

interface BlogMetrics {
  totalBlogViews: number;
  avgEngagementRate: number;
  topBlogs: Array<{
    slug: string;
    title: string;
    views: number;
    scrolls: number;
    engagementRate: number;
    avgTimeOnPage: number;
  }>;
  slotPerformance: Array<{
    slot: string;
    views: number;
    avgEngagement: number;
    avgTimeOnPage: number;
  }>;
  recentBlogs: Array<{
    slug: string;
    views: number;
    publishedAt: string;
  }>;
}

export async function calculateBlogMetrics(
  events: any[],
  blogs: any[]
): Promise<BlogMetrics> {
  // Filter blog-related events
  const blogViewEvents = events.filter((e) => e.eventName === "BlogView");
  const blogScrollEvents = events.filter((e) => e.eventName === "BlogScroll");
  const blogEngagementEvents = events.filter((e) => e.eventName === "BlogEngagement");

  const totalBlogViews = blogViewEvents.length;

  // Aggregate by blog slug
  const blogStats: Record<
    string,
    {
      views: number;
      scrolls: number;
      engagementTime: number;
      engagementCount: number;
    }
  > = {};

  blogViewEvents.forEach((e) => {
    const slug = e.eventData?.slug;
    if (slug) {
      if (!blogStats[slug]) {
        blogStats[slug] = { views: 0, scrolls: 0, engagementTime: 0, engagementCount: 0 };
      }
      blogStats[slug].views++;
    }
  });

  blogScrollEvents.forEach((e) => {
    const slug = e.eventData?.slug;
    if (slug && blogStats[slug]) {
      blogStats[slug].scrolls++;
    }
  });

  blogEngagementEvents.forEach((e) => {
    const slug = e.eventData?.slug;
    const timeOnPage = e.eventData?.timeOnPage || 0;
    if (slug && blogStats[slug]) {
      blogStats[slug].engagementCount++;
      blogStats[slug].engagementTime += timeOnPage;
    }
  });

  // Create top blogs list
  const topBlogs = Object.entries(blogStats)
    .map(([slug, stats]) => {
      const blog = blogs.find((b: any) => b.slug === slug);
      return {
        slug,
        title: blog?.title || slug,
        views: stats.views,
        scrolls: stats.scrolls,
        engagementRate: stats.views > 0 ? (stats.scrolls / stats.views) * 100 : 0,
        avgTimeOnPage: stats.engagementCount > 0 ? Math.round(stats.engagementTime / stats.engagementCount) : 0,
      };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Calculate average engagement rate
  const engagementRates = topBlogs.map((b) => b.engagementRate);
  const avgEngagementRate =
    engagementRates.length > 0
      ? engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
      : 0;

  // Calculate A/B test slot performance
  const slotPerformance: Record<
    string,
    { views: number; totalEngagement: number; totalTime: number; count: number }
  > = {
    "9am": { views: 0, totalEngagement: 0, totalTime: 0, count: 0 },
    "2pm": { views: 0, totalEngagement: 0, totalTime: 0, count: 0 },
    "7pm": { views: 0, totalEngagement: 0, totalTime: 0, count: 0 },
  };

  blogViewEvents.forEach((e) => {
    const slot = e.eventData?.abTestSlot || "unknown";
    if (slotPerformance[slot]) {
      slotPerformance[slot].views++;
    }
  });

  blogEngagementEvents.forEach((e) => {
    const slot = e.eventData?.abTestSlot;
    const timeOnPage = e.eventData?.timeOnPage || 0;
    if (slot && slotPerformance[slot]) {
      slotPerformance[slot].totalEngagement++;
      slotPerformance[slot].totalTime += timeOnPage;
      slotPerformance[slot].count++;
    }
  });

  const slotStats = Object.entries(slotPerformance)
    .map(([slot, stats]) => ({
      slot,
      views: stats.views,
      avgEngagement: stats.views > 0 ? (stats.totalEngagement / stats.views) * 100 : 0,
      avgTimeOnPage: stats.count > 0 ? Math.round(stats.totalTime / stats.count) : 0,
    }))
    .sort((a, b) => b.views - a.views);

  // Recent blogs (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentBlogs = blogs
    .filter((b: any) => b.publishedAt && new Date(b.publishedAt) > sevenDaysAgo)
    .map((b: any) => ({
      slug: b.slug,
      views: blogStats[b.slug]?.views || 0,
      publishedAt: b.publishedAt,
    }))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return {
    totalBlogViews,
    avgEngagementRate,
    topBlogs,
    slotPerformance: slotStats,
    recentBlogs,
  };
}
