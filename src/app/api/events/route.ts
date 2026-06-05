/**
 * POST /api/events
 *
 * Receives analytics events from the client and stores them in Payload.
 * Also handles IP anonymization for GDPR compliance.
 *
 * Called by: src/lib/analytics/track.ts trackEvent()
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { anonymizeIp } from "@/lib/analytics/visitor";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.eventName || !body.visitorId || !body.sessionId) {
      return Response.json(
        { error: "Missing required fields: eventName, visitorId, sessionId" },
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

    const payload = await getPayload({ config });

    // Store event in Payload
    const event = await payload.create({
      collection: "events",
      data: {
        visitorId: body.visitorId,
        sessionId: body.sessionId,
        eventName: body.eventName,
        eventData: body.eventData || {},
        pageUrl: body.pageUrl || "",
        referrer: body.referrer,
        userAgent: body.userAgent,
        ipAddress: anonIp,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        utmContent: body.utmContent,
        timestamp: body.timestamp || new Date().toISOString(),
      },
    });

    return Response.json({ ok: true, eventId: event.id }, { status: 201 });
  } catch (err) {
    console.error("[events/route]", err);
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Failed to store event",
      },
      { status: 500 }
    );
  }
}
