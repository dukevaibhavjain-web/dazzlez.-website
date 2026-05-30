import type { GlobalConfig } from "payload";

/**
 * Site Settings — editable copy that appears on the storefront and in admin.
 * Keep it minimal here; add more tabs (Branding, Contact, Legal) as the site grows.
 */
export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  admin: {
    description: "Site-wide configuration. Disclaimer text, badges, copy.",
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
          label: "Tracking & Pixels",
          description: "Paste your pixel/analytics IDs here. Scripts are injected automatically — no code changes needed.",
          fields: [
            {
              name: "metaPixelId",
              type: "text",
              label: "Meta (Facebook) Pixel ID",
              admin: {
                placeholder: "e.g. 1234567890123456",
                description:
                  "Found in Meta Events Manager → your pixel → Settings. A 15–16 digit number.",
              },
            },
            {
              name: "ga4MeasurementId",
              type: "text",
              label: "Google Analytics 4 Measurement ID",
              admin: {
                placeholder: "e.g. G-XXXXXXXXXX",
                description:
                  "Found in GA4 Admin → Data Streams → your stream → Measurement ID. Starts with 'G-'.",
              },
            },
            {
              name: "tiktokPixelId",
              type: "text",
              label: "TikTok Pixel ID",
              admin: {
                placeholder: "e.g. C3ABC123DEF456GHI",
                description:
                  "Found in TikTok Ads Manager → Assets → Events → your pixel. Alphanumeric string.",
              },
            },
            {
              name: "whatsappNumber",
              type: "text",
              label: "WhatsApp Business Number",
              defaultValue: "+919829115205",
              admin: {
                placeholder: "+91XXXXXXXXXX",
                description:
                  "International format. Used in the Design Advisor and Try-at-Home WA links.",
              },
            },
            {
              name: "googleTagManagerId",
              type: "text",
              label: "Google Tag Manager ID (optional)",
              admin: {
                placeholder: "e.g. GTM-XXXXXXX",
                description:
                  "If you use GTM, enter the container ID. GTM can manage all other pixels, so leave the above IDs blank if GTM handles them.",
              },
            },
          ],
        },
        {
          label: "Checkout & Payments",
          fields: [
            {
              name: "cashfreeEnvironment",
              type: "select",
              label: "Cashfree Environment",
              defaultValue: "sandbox",
              options: [
                { label: "🧪 Sandbox (test)", value: "sandbox"    },
                { label: "🚀 Production",      value: "production" },
              ],
              admin: {
                description:
                  "Switch to Production when you are ready to accept real payments.",
              },
            },
            {
              name: "checkoutDepositPct",
              type: "number",
              label: "Deposit Percentage",
              defaultValue: 100,
              min: 10,
              max: 100,
              admin: {
                description:
                  "Percentage of order total charged at checkout. 100 = full payment upfront (default). Lower values (e.g. 50) create a deposit flow.",
              },
            },
            {
              name: "checkoutCurrency",
              type: "select",
              label: "Currency",
              defaultValue: "INR",
              options: [
                { label: "₹ INR", value: "INR" },
              ],
              admin: {
                description: "Currency shown at checkout. Cashfree supports INR.",
              },
            },
          ],
        },
        {
          label: "Pricing Disclaimers",
          fields: [
            {
              name: "madeToOrderDisclaimer",
              type: "textarea",
              label: "Made-to-Order Disclaimer",
              defaultValue:
                "Most of our pieces are crafted to order. The price shown is an estimate based on current gold and diamond rates. The final invoice is issued at dispatch and may vary slightly depending on the exact stones sourced and any rate movement during production.",
              admin: {
                description:
                  "Shown on PDP and quote PDFs for made-to-order products.",
              },
            },
            {
              name: "readyStockBadgeText",
              type: "text",
              label: "Ready Stock Badge Text",
              defaultValue: "In Stock — ready to ship",
              admin: { description: "Shown on PDP for ready-stock products." },
            },
            {
              name: "readyStockPriceNote",
              type: "text",
              label: "Ready Stock Price Note",
              defaultValue: "Confirmed price. Ships within 3-5 business days.",
            },
            {
              name: "quoteValidityDays",
              type: "number",
              label: "Quote Validity (days)",
              defaultValue: 7,
              admin: {
                description:
                  "How long a generated quote stays valid before gold-rate movement requires a fresh quote.",
              },
            },
          ],
        },
      ],
    },
  ],
};
