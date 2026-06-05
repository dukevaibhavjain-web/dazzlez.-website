/**
 * Publishing time optimization
 * A/B testing + slot performance analysis
 */

import { Anthropic } from "@anthropic-ai/sdk";
import type { Payload } from "payload";

export type SlotStats = {
  slot: "9am" | "2pm" | "7pm";
  avgViews: number;
  avgScrollDepth: number;
  avgTimeOnPage: number;
  blogCount: number;
};

/**
 * Assign A/B test slot using round-robin
 * Blog 1 → 9am, Blog 2 → 2pm, Blog 3 → 7pm, Blog 4 → 9am, etc.
 */
export function assignAbTestSlot(blogNumber: number): "9am" | "2pm" | "7pm" {
  const slots: Array<"9am" | "2pm" | "7pm"> = ["9am", "2pm", "7pm"];
  return slots[blogNumber % 3];
}

/**
 * Compute performance stats for each A/B test slot
 * Analyzes Events collection for BlogView and BlogScroll events
 * Only counts events from first 7 days after publish
 */
export async function computeSlotStats(payload: Payload): Promise<SlotStats[]> {
  try {
    // Fetch all published blogs with their metrics
    const blogs = await payload.find({
      collection: "blogs",
      where: {
        status: { equals: "published" },
        publishedAt: { exists: true },
      },
      select: {
        id: true,
        slug: true,
        abTestSlot: true,
        publishedAt: true,
        viewCount: true,
      },
      limit: 1000,
      depth: 0,
    });

    // Fetch events for all published blogs
    const events = await payload.find({
      collection: "events",
      where: {
        eventName: { in: ["BlogView", "BlogScroll", "BlogEngagement"] },
      },
      select: {
        blogSlug: true,
        eventName: true,
        scrollDepth: true,
        timeOnPage: true,
        timestamp: true,
      },
      limit: 10000,
      depth: 0,
    });

    // Map blogs by slug for quick lookup
    const blogMap = new Map<string, (typeof blogs.docs)[0]>();
    for (const blog of blogs.docs) {
      const slug = (blog as any).slug as string;
      blogMap.set(slug, blog);
    }

    // Compute stats per slot
    const stats = new Map<"9am" | "2pm" | "7pm", { views: number[]; scrolls: number[]; times: number[]; count: number }>();

    for (const slot of ["9am", "2pm", "7pm"] as const) {
      stats.set(slot, { views: [], scrolls: [], times: [], count: 0 });
    }

    for (const event of events.docs) {
      const blogSlug = (event as any).blogSlug as string;
      const blog = blogMap.get(blogSlug);
      if (!blog || !blog.abTestSlot) continue;

      const slot = (blog as any).abTestSlot as "9am" | "2pm" | "7pm";
      const publishedAt = (blog as any).publishedAt ? new Date((blog as any).publishedAt as string) : null;
      const timestamp = (event as any).timestamp ? new Date((event as any).timestamp as string) : new Date();

      // Only count events within 7 days of publish
      if (publishedAt && timestamp.getTime() - publishedAt.getTime() > 7 * 24 * 60 * 60 * 1000) {
        continue;
      }

      const slotStats = stats.get(slot)!;

      if ((event as any).eventName === "BlogView") {
        slotStats.views.push(1);
      }

      if ((event as any).eventName === "BlogScroll") {
        const scrollDepth = (event as any).scrollDepth as number;
        slotStats.scrolls.push(scrollDepth || 0);
      }

      if ((event as any).eventName === "BlogEngagement") {
        const timeOnPage = (event as any).timeOnPage as number;
        slotStats.times.push(timeOnPage || 0);
      }
    }

    // Calculate averages
    const result: SlotStats[] = [];

    for (const [slot, data] of stats.entries()) {
      result.push({
        slot,
        avgViews: data.views.length > 0 ? data.views.length : 0,
        avgScrollDepth: data.scrolls.length > 0 ? data.scrolls.reduce((a, b) => a + b, 0) / data.scrolls.length : 0,
        avgTimeOnPage: data.times.length > 0 ? data.times.reduce((a, b) => a + b, 0) / data.times.length : 0,
        blogCount: new Set(blogs.docs.filter((b) => (b as any).abTestSlot === slot).map((b) => (b as any).id)).size,
      });
    }

    return result;
  } catch (error) {
    console.error("[computeSlotStats] Error:", error);
    return [];
  }
}

/**
 * Generate timing recommendation from slot stats
 * Calls Claude to analyze and recommend best slot
 */
export async function generateTimingRecommendation(
  stats: SlotStats[]
): Promise<{ recommendedSlot: "9am" | "2pm" | "7pm" | "none"; reason: string }> {
  const client = new Anthropic();

  const statsTable = stats
    .map(
      (s) => `${s.slot}: ${s.avgViews} avg views, ${s.avgScrollDepth.toFixed(1)}% scroll depth, ${s.avgTimeOnPage.toFixed(0)}s on page (n=${s.blogCount})`
    )
    .join("\n");

  const prompt = `Analyze these A/B test results for blog publishing times (7-day engagement window):

${statsTable}

Which time slot should we prioritize for publishing? Consider:
- View count (traffic)
- Scroll depth (engagement)
- Time on page (content consumption)

If data is limited (< 2 blogs per slot), note this is directional, not statistically significant.

Return ONLY JSON:
{"recommendedSlot": "9am"|"2pm"|"7pm"|"none", "reason": "2-3 sentence explanation"}`;

  try {
    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in recommendation");
    }

    return JSON.parse(jsonMatch[0]) as {
      recommendedSlot: "9am" | "2pm" | "7pm" | "none";
      reason: string;
    };
  } catch (error) {
    console.error("[generateTimingRecommendation] Error:", error);
    return {
      recommendedSlot: "none",
      reason: "Unable to generate recommendation due to error",
    };
  }
}
