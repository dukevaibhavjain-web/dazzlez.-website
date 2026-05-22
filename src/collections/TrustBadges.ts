import type { CollectionConfig } from "payload";

export const TrustBadges: CollectionConfig = {
  slug: "trust-badges",
  admin: {
    useAsTitle: "label",
    defaultColumns: ["order", "icon", "label", "active"],
    group: "Site",
    description: "Configurable trust badges shown on the product page below the Buy button.",
  },
  access: { read: () => true },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "icon",
          type: "text",
          required: true,
          admin: {
            width: "20%",
            description: "Emoji or symbol (e.g. ✦ ✓ 🔄 🚚)",
          },
        },
        {
          name: "label",
          type: "text",
          required: true,
          admin: { width: "80%" },
        },
      ],
    },
    {
      name: "tooltip",
      type: "textarea",
      admin: {
        description: "Shown on hover — keep under 120 characters.",
        rows: 2,
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "order",
          type: "number",
          defaultValue: 0,
          admin: {
            width: "30%",
            description: "Lower = appears first",
          },
        },
        {
          name: "active",
          type: "checkbox",
          defaultValue: true,
          admin: {
            width: "20%",
            description: "Visible on site",
          },
        },
      ],
    },
  ],
};
