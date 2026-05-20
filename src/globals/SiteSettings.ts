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
