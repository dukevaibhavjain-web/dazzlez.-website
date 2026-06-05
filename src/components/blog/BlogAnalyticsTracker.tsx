"use client";

/**
 * BlogAnalyticsTracker — Client-side analytics tracking for blog posts
 * Tracks: BlogView, BlogScroll, BlogEngagement events
 */

import { useEffect, useRef } from "react";

interface TrackerProps {
  slug: string;
  title: string;
  abTestSlot?: string;
}

export function BlogAnalyticsTracker({ slug, title, abTestSlot }: TrackerProps) {
  const startTimeRef = useRef<number>(Date.now());
  const scrollTrackedRef = useRef<boolean>(false);
  const engagementTimeRef = useRef<number>(0);

  useEffect(() => {
    // Track initial page view
    trackEvent("BlogView", {
      slug,
      title,
      abTestSlot: abTestSlot || "unknown",
    });

    // Track scroll engagement
    function handleScroll() {
      if (!scrollTrackedRef.current) {
        const scrollPercentage = getScrollPercentage();
        if (scrollPercentage > 25) {
          scrollTrackedRef.current = true;
          trackEvent("BlogScroll", {
            slug,
            scrollPercentage: Math.round(scrollPercentage),
            abTestSlot: abTestSlot || "unknown",
          });
        }
      }
    }

    // Track engagement (time on page every 30 seconds)
    function trackEngagement() {
      engagementTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const scrollPercentage = getScrollPercentage();

      trackEvent("BlogEngagement", {
        slug,
        timeOnPage: engagementTimeRef.current,
        scrollDepth: Math.round(scrollPercentage) / 100,
        abTestSlot: abTestSlot || "unknown",
      });
    }

    window.addEventListener("scroll", handleScroll);
    const engagementInterval = setInterval(trackEngagement, 30000);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(engagementInterval);
    };
  }, [slug, title, abTestSlot]);

  return null;
}

function getScrollPercentage(): number {
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  if (scrollHeight === 0) return 0;
  return (window.scrollY / scrollHeight) * 100;
}

async function trackEvent(
  eventName: string,
  eventData: Record<string, any>
) {
  try {
    await fetch("/api/events/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventData,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error(`[BlogAnalyticsTracker] Failed to track ${eventName}:`, err);
  }
}
