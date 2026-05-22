import type { CollectionConfig } from "payload";

export const FAQs: CollectionConfig = {
  slug: "faqs",
  admin: {
    useAsTitle: "question",
    defaultColumns: ["order", "category", "question", "active"],
    group: "Site",
    description:
      "FAQ accordion shown on all product pages. Drag rows or set 'order' to control sequence.",
  },
  access: { read: () => true },
  fields: [
    {
      name: "question",
      type: "text",
      required: true,
    },
    {
      name: "answer",
      type: "textarea",
      required: true,
      admin: { rows: 5 },
    },
    {
      type: "row",
      fields: [
        {
          name: "category",
          type: "select",
          defaultValue: "general",
          admin: { width: "40%" },
          options: [
            { label: "General",           value: "general" },
            { label: "Lab Diamonds",      value: "diamonds" },
            { label: "Pricing",           value: "pricing" },
            { label: "Returns & Exchange", value: "returns" },
            { label: "Shipping",          value: "shipping" },
          ],
        },
        {
          name: "order",
          type: "number",
          defaultValue: 0,
          admin: { width: "30%", description: "Lower = appears first" },
        },
        {
          name: "active",
          type: "checkbox",
          defaultValue: true,
          admin: { width: "30%", description: "Uncheck to hide on site" },
        },
      ],
    },
  ],
};
