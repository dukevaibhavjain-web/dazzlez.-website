/**
 * Events Collection
 *
 * Stores user interaction events for analytics:
 * - Product funnel (ViewContent → AddToCart → Purchase)
 * - Blog analytics (views, scroll depth, engagement)
 * - Search interactions
 * - Chatbot events
 *
 * Dual-tracked to: Payload (this collection) + GA4 + Meta Pixel
 * Used by: /admin/analytics dashboard, product performance analysis
 */

import { CollectionConfig } from "payload";

export const Events: CollectionConfig = {
  slug: "events",
  admin: {
    useAsTitle: "eventName",
    group: "Analytics",
    defaultColumns: ["eventName", "visitorId", "timestamp", "eventData"],
    listSearchableFields: ["eventName", "visitorId", "sessionId", "pageUrl"],
  },
  access: {
    read: ({ req }) => Boolean(req.user), // admin-only read
    create: () => true, // public write (via /api/events)
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    // Identifiers
    {
      name: "visitorId",
      type: "text",
      required: true,
      indexed: true,
      admin: { description: "Anonymous visitor ID (dz_timestamp_random)" },
    },
    {
      name: "sessionId",
      type: "text",
      required: true,
      indexed: true,
      admin: { description: "Session ID (persists across page reloads)" },
    },

    // Event metadata
    {
      name: "eventName",
      type: "select",
      required: true,
      indexed: true,
      options: [
        // Product funnel
        { label: "ViewContent", value: "ViewContent" },
        { label: "AddToCart", value: "AddToCart" },
        { label: "ViewCart", value: "ViewCart" },
        { label: "InitiateCheckout", value: "InitiateCheckout" },
        { label: "Purchase", value: "Purchase" },
        // Blog
        { label: "BlogView", value: "BlogView" },
        { label: "BlogScroll", value: "BlogScroll" },
        { label: "BlogEngagement", value: "BlogEngagement" },
        { label: "BlogProductClick", value: "BlogProductClick" },
        // Search
        { label: "Search", value: "Search" },
        { label: "SearchResultClick", value: "SearchResultClick" },
        // Chatbot
        { label: "ChatbotOpened", value: "ChatbotOpened" },
        { label: "DesignAdvisorStart", value: "DesignAdvisorStart" },
        { label: "DesignAdvisorComplete", value: "DesignAdvisorComplete" },
        // Other
        { label: "Contact", value: "Contact" },
        { label: "Lead", value: "Lead" },
      ],
    },

    {
      name: "eventData",
      type: "json",
      admin: {
        description: "Flexible event payload (product code, price, blog slug, etc.)",
      },
    },

    // Context
    {
      name: "pageUrl",
      type: "text",
      required: true,
      indexed: true,
    },

    {
      name: "referrer",
      type: "text",
      admin: { description: "HTTP referrer header" },
    },

    {
      name: "userAgent",
      type: "textarea",
      admin: { description: "Browser user agent string" },
    },

    {
      name: "ipAddress",
      type: "text",
      admin: { description: "Anonymized IP (last octet redacted)" },
    },

    // Attribution & UTM
    {
      name: "utmSource",
      type: "text",
      indexed: true,
    },
    {
      name: "utmMedium",
      type: "text",
      indexed: true,
    },
    {
      name: "utmCampaign",
      type: "text",
      indexed: true,
    },
    {
      name: "utmContent",
      type: "text",
    },

    // Monetization (for purchases)
    {
      name: "revenue",
      type: "number",
      admin: { description: "Revenue in INR (if purchase event)" },
    },
    {
      name: "currency",
      type: "text",
      defaultValue: "INR",
    },
    {
      name: "orderId",
      type: "text",
      indexed: true,
      admin: { description: "Order ID if this is a purchase event" },
    },

    // Blog-specific
    {
      name: "blogSlug",
      type: "text",
      indexed: true,
      admin: { description: "Blog post slug if this is a blog event" },
    },
    {
      name: "scrollDepth",
      type: "number",
      admin: { description: "Scroll depth 0-100% (blog events)" },
    },
    {
      name: "timeOnPage",
      type: "number",
      admin: { description: "Time on page in seconds" },
    },

    // Temporal
    {
      name: "timestamp",
      type: "date",
      required: true,
      indexed: true,
      admin: { description: "Event timestamp (ISO 8601)" },
    },
  ],

  timestamps: true, // adds createdAt, updatedAt
};
