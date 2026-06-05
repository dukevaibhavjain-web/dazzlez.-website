/**
 * Unified Event Tracking
 *
 * Fires events to:
 * 1. Payload Events collection (custom DB, analytics dashboard)
 * 2. GA4 (Google Analytics)
 * 3. Meta Pixel (Facebook Ads)
 * 4. TikTok Pixel
 *
 * Usage:
 *   trackEvent('ViewContent', { code: 'RR-001', price: 50000 })
 *   trackEvent('Purchase', { orderId: 'DZ-2026-12345', revenue: 60000, currency: 'INR' })
 */

import {
  getVisitorId,
  getSessionId,
  getUtmParams,
  anonymizeIp,
} from "./visitor";

export interface EventData {
  [key: string]: any;
}

export interface EventPayload {
  visitorId: string;
  sessionId: string;
  eventName: string;
  eventData: EventData;
  pageUrl: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  timestamp: string;
}

/**
 * Track an event across all platforms
 * Fire-and-forget: failures don't block UX
 */
export async function trackEvent(
  eventName: string,
  eventData: EventData = {}
): Promise<void> {
  if (typeof window === "undefined") return; // server-side render, skip

  const utm = getUtmParams();

  const payload: EventPayload = {
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    eventName,
    eventData,
    pageUrl: window.location.href,
    referrer: document.referrer || undefined,
    userAgent: navigator.userAgent,
    // IP will be added server-side from request headers
    utmSource: utm.source,
    utmMedium: utm.medium,
    utmCampaign: utm.campaign,
    utmContent: utm.content,
    timestamp: new Date().toISOString(),
  };

  // Fire to Payload (custom DB)
  fireToPayload(payload).catch((err) => {
    console.warn("[analytics] Payload event failed:", err);
  });

  // Fire to GA4
  fireToGA4(eventName, eventData);

  // Fire to Meta Pixel
  fireToMetaPixel(eventName, eventData);

  // Fire to TikTok Pixel
  fireToTikTok(eventName, eventData);
}

/**
 * Store event in Payload Events collection
 */
async function fireToPayload(payload: EventPayload): Promise<void> {
  try {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`[analytics] Payload API returned ${response.status}`);
    }
  } catch (err) {
    // Silent fail — don't break UX if analytics is down
    console.warn("[analytics] Failed to send to Payload:", err);
  }
}

/**
 * Fire to Google Analytics 4
 */
function fireToGA4(eventName: string, eventData: EventData): void {
  if (typeof window === "undefined" || !("gtag" in window)) return;

  try {
    const gtag = (window as any).gtag;
    gtag("event", eventName, {
      value: eventData.revenue,
      currency: eventData.currency || "INR",
      ...eventData,
    });
  } catch (err) {
    console.warn("[analytics] GA4 tracking failed:", err);
  }
}

/**
 * Fire to Meta Pixel (Facebook)
 */
function fireToMetaPixel(eventName: string, eventData: EventData): void {
  if (typeof window === "undefined" || !("fbq" in window)) return;

  try {
    const fbq = (window as any).fbq;

    // Standard events
    const standardEvents: Record<string, string> = {
      ViewContent: "ViewContent",
      AddToCart: "AddToCart",
      InitiateCheckout: "InitiateCheckout",
      Purchase: "Purchase",
      Lead: "Lead",
      Contact: "Contact",
      Search: "Search",
    };

    if (standardEvents[eventName]) {
      fbq("track", standardEvents[eventName], {
        value: eventData.revenue,
        currency: eventData.currency || "INR",
        ...eventData,
      });
    } else {
      // Custom events
      fbq("trackCustom", eventName, {
        value: eventData.revenue,
        currency: eventData.currency || "INR",
        ...eventData,
      });
    }
  } catch (err) {
    console.warn("[analytics] Meta Pixel tracking failed:", err);
  }
}

/**
 * Fire to TikTok Pixel
 */
function fireToTikTok(eventName: string, eventData: EventData): void {
  if (typeof window === "undefined" || !("ttq" in window)) return;

  try {
    const ttq = (window as any).ttq;

    // Standard TikTok events
    const tiktokEvents: Record<string, string> = {
      ViewContent: "ViewContent",
      AddToCart: "AddToCart",
      InitiateCheckout: "InitiateCheckout",
      Purchase: "PlaceAnOrder",
      Lead: "Contact",
      Contact: "Contact",
      Search: "Search",
    };

    const ttEvent = tiktokEvents[eventName] || eventName;

    ttq.track(ttEvent, {
      value: eventData.revenue,
      currency: eventData.currency || "INR",
      ...eventData,
    });
  } catch (err) {
    console.warn("[analytics] TikTok tracking failed:", err);
  }
}

/**
 * Convenience functions for common events
 */

export function trackViewContent(code: string, displayName: string, price: number): void {
  trackEvent("ViewContent", {
    product_id: code,
    product_name: displayName,
    value: price,
    currency: "INR",
  });
}

export function trackAddToCart(code: string, metal: string, price: number, quantity: number = 1): void {
  trackEvent("AddToCart", {
    product_id: code,
    metal,
    value: price * quantity,
    currency: "INR",
    quantity,
  });
}

export function trackInitiateCheckout(cartTotal: number, itemCount: number): void {
  trackEvent("InitiateCheckout", {
    value: cartTotal,
    currency: "INR",
    num_items: itemCount,
  });
}

export function trackPurchase(orderId: string, revenue: number, items: any[]): void {
  trackEvent("Purchase", {
    orderId,
    revenue,
    currency: "INR",
    num_items: items.length,
    items,
  });
}

export function trackBlogView(slug: string, title: string): void {
  trackEvent("BlogView", {
    blog_slug: slug,
    blog_title: title,
  });
}

export function trackBlogProductClick(blogSlug: string, productCode: string): void {
  trackEvent("BlogProductClick", {
    blog_slug: blogSlug,
    product_code: productCode,
  });
}

export function trackSearch(query: string, resultCount: number): void {
  trackEvent("Search", {
    search_term: query,
    result_count: resultCount,
  });
}
