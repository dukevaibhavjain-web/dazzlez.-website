import type { CollectionConfig } from "payload";

/**
 * Diamond categories — the buyer-facing types of diamond we sell.
 * Currently: Natural, Lab Grown Premium, Lab Grown Standard.
 * Easy to add more (e.g., "Lab Grown Eco") via admin.
 */
export const DiamondCategories: CollectionConfig = {
  slug: "diamond-categories",
  labels: { singular: "Diamond Category", plural: "Diamond Categories" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "displayOrder"],
    group: "Pricing",
  },
  access: { read: () => true },
  fields: [
    { name: "name", type: "text", required: true, unique: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "URL-safe identifier: 'natural', 'lab-premium', 'lab-standard'." },
    },
    { name: "description", type: "textarea" },
    { name: "displayOrder", type: "number", defaultValue: 100 },
  ],
};
