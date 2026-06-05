/**
 * POST /api/events/track
 *
 * Simplified event tracking endpoint for blog and content analytics.
 * Does not require visitorId/sessionId.
 * Uses browser fingerprint for privacy-respecting tracking.
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { anonymizeIp } from "@/lib/analytics/visitor";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.eventName || !body.eventData) {
      return Response.json(
        { error: "Missing required fields: eventName, eventData" },
        { status: 400 }
      );
    }

    // Extract IP from request headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    // Anonymize IP for GDPR
    const anonIp = anonymizeIp(ip);

    // Generate simple browser fingerprint from user agent
    const userAgent = req.headers.get("user-agent") || "unknown";
    const visitorId = `anon-${hashString(userAgent + ip)}`;
    const sessionId = body.sessionId || `session-${Date.now()}`;

    const payload = await getPayload({ config });

    // Store event in Payload
    await payload.create({
      collection: "events",
      data: {
        visitorId,
        sessionId,
        eventName: body.eventName,
        eventData: body.eventData,
        pageUrl: body.pageUrl || typeof window !== "undefined" ? window.location.href : "",
        referrer: body.referrer || "",
        userAgent,
        ipAddress: anonIp,
        timestamp: body.timestamp || new Date().toISOString(),
      },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[events/track]", err);
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Failed to track event",
      },
      { status: 500 }
    );
  }
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
