import type { GlobalConfig } from "payload";

/**
 * Feature Flags — the "kill switch panel".
 *
 * Every external integration in the site checks these before running. When OFF,
 * a manual fallback is used. Defaults are all FALSE so the site launches in a
 * fully manual mode — we flip individual flags ON only after the integration
 * is built and verified.
 */
export const FeatureFlags: GlobalConfig = {
  slug: "feature-flags",
  label: "Feature Flags (Kill Switches)",
  admin: {
    description:
      "Master switches for every external integration. When a switch is OFF, a safe manual fallback runs. Flip ON only after you've tested the integration.",
    group: "Admin",
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "WhatsApp",
          description:
            "When OFF: 'Continue on WhatsApp' buttons fall back to wa.me deep links to the personal number.",
          fields: [
            { name: "wa_business_api", type: "checkbox", label: "WA Business API (Cloud API webhook)", defaultValue: false },
            { name: "wa_shared_inbox", type: "checkbox", label: "Multi-agent shared inbox", defaultValue: false },
            { name: "wa_login", type: "checkbox", label: "Login with WhatsApp", defaultValue: false },
          ],
        },
        {
          label: "AI",
          description: "AI-assisted features. All OFF until trained on our data.",
          fields: [
            { name: "ai_draft_replies", type: "checkbox", label: "AI drafts replies for human agents", defaultValue: false },
            { name: "ai_web_chatbot", type: "checkbox", label: "Web chatbot widget", defaultValue: false },
            { name: "ai_voice_agent", type: "checkbox", label: "Voice agent for outbound calls", defaultValue: false },
            { name: "ai_reference_image_search", type: "checkbox", label: "Reverse image search on customer references", defaultValue: false },
          ],
        },
        {
          label: "Pricing & FX",
          description: "When OFF: prices use the manual rates set in the Rates section of admin.",
          fields: [
            { name: "gold_rate_live_ibja", type: "checkbox", label: "Auto-pull gold rate from IBJA daily", defaultValue: false },
            { name: "gold_rate_auto_recompute", type: "checkbox", label: "Recompute all product prices when rate changes", defaultValue: false },
            { name: "fx_live", type: "checkbox", label: "Auto-pull FX rates daily (multi-currency display)", defaultValue: false },
          ],
        },
        {
          label: "Checkout",
          description: "When OFF: 'Add to Cart' becomes 'Request Quote' (form-only).",
          fields: [
            { name: "checkout_cashfree", type: "checkbox", label: "Real checkout via Cashfree", defaultValue: false },
            { name: "checkout_gst_invoice_pdf", type: "checkbox", label: "Auto-generate GST invoice PDF on order", defaultValue: false },
            { name: "shipping_serviceability", type: "checkbox", label: "Try-At-Home pincode serviceability lookup", defaultValue: false },
          ],
        },
        {
          label: "Marketing",
          fields: [
            { name: "meta_capi_server_side", type: "checkbox", label: "Meta CAPI (server-side events for ad audiences)", defaultValue: false },
            { name: "email_transactional", type: "checkbox", label: "Send transactional emails (order/lead) via real provider", defaultValue: false },
            { name: "email_campaigns", type: "checkbox", label: "Scheduled email campaigns", defaultValue: false },
            { name: "campaigns_scheduled_sends", type: "checkbox", label: "Background scheduled campaign sender", defaultValue: false },
          ],
        },
        {
          label: "Discovery",
          fields: [
            { name: "search_semantic_pgvector", type: "checkbox", label: "Semantic search via pgvector", defaultValue: false },
            { name: "similar_products_vector", type: "checkbox", label: "Similar-products via vector similarity", defaultValue: false },
            { name: "scraper_competitor_designs", type: "checkbox", label: "Background scraper for competitor designs (RAG)", defaultValue: false },
          ],
        },
        {
          label: "Wallet",
          fields: [
            { name: "wallet_cashback_engine", type: "checkbox", label: "Auto-credit cashback on orders", defaultValue: false },
            { name: "wallet_loyalty_points", type: "checkbox", label: "Loyalty points accrual + redemption", defaultValue: false },
          ],
        },
        {
          label: "Internationalization",
          fields: [
            { name: "i18n_hindi", type: "checkbox", label: "Hindi translations", defaultValue: false },
            { name: "i18n_other_languages", type: "checkbox", label: "Other languages (set per-language in admin)", defaultValue: false },
          ],
        },
      ],
    },
  ],
};
