/**
 * Pixel event helpers — fires Meta, Google Analytics 4, and TikTok
 * events from a single call. All calls are no-ops if the pixel is
 * not loaded (e.g. ad-blocker, dev env without pixel script).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type Params = Record<string, unknown>;

/** Standard pixel events (shared across platforms) */
export function trackEvent(event: string, params?: Params) {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.fbq)       w.fbq("track", event, params);
  if (w.gtag)      w.gtag("event", event, params);
  if (w.ttq?.track) w.ttq.track(event, params);
}

/** Custom / named events (Meta trackCustom, GA4 custom, TikTok custom) */
export function trackCustom(event: string, params?: Params) {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.fbq)        w.fbq("trackCustom", event, params);
  if (w.gtag)       w.gtag("event", event, params);
  if (w.ttq?.track) w.ttq.track(event, params);
}

// ── Named helpers used in the chatbot flow ───────────────────────────────────

export const pixel = {
  chatbotOpened:    () => trackCustom("ChatbotOpened"),
  occasionSelected: (occasion: string) =>
    trackCustom("OccasionSelected", { occasion }),
  productSelected:  (product: string) =>
    trackCustom("ProductTypeSelected", { product }),
  budgetSelected:   (label: string, max: number) =>
    trackCustom("BudgetSelected", { budget_label: label, budget_max: max }),
  preferenceSelected: (pref: string) =>
    trackCustom("DesignPreferenceSelected", { preference: pref }),
  leadSubmitted:    (product: string, budget: string) =>
    trackEvent("Lead", { content_name: "AI Chatbot Lead", product, budget }),
  whatsappClicked:  () => trackEvent("Contact", { method: "WhatsApp" }),
  callClicked:      () => trackEvent("Contact", { method: "Call" }),

  // /design page events
  designPageLoaded:       () => trackCustom("DesignPageLoaded"),
  productResultsViewed:   (count: number, product: string) =>
    trackCustom("ProductResultsViewed", { count, product }),
  loadMoreClicked:        (page: number) =>
    trackCustom("LoadMoreClicked", { page }),
};
