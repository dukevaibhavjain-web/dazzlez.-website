import type { CollectionConfig } from "payload";

/**
 * Color stones master list. Each row is a distinct stone variety we offer.
 * Add new stones anytime — the importer picks them up by slug.
 */
export const ColorStones: CollectionConfig = {
  slug: "color-stones",
  labels: { singular: "Color Stone", plural: "Color Stones" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "grade", "ratePerCt"],
    group: "Pricing",
  },
  access: { read: () => true },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "URL-safe: 'ruby', 'emerald', 'blue-sapphire'." },
    },
    {
      name: "grade",
      type: "select",
      defaultValue: "Standard",
      options: [
        { label: "Premium", value: "Premium" },
        { label: "Standard", value: "Standard" },
      ],
    },
    {
      name: "ratePerCt",
      type: "number",
      required: true,
      admin: { description: "INR per carat. Editable anytime." },
    },
    { name: "notes", type: "textarea" },
  ],
};
