import type { CollectionConfig } from "payload";

export const SubCategories: CollectionConfig = {
  slug: "sub-categories",
  labels: { singular: "Sub-Category", plural: "Sub-Categories" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "category", "slug", "sortOrder"],
    group: "Catalog",
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      index: true,
      admin: { description: "URL-safe identifier, e.g. 'halo', 'trilogy'." },
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: true,
      index: true,
    },
    { name: "sortOrder", type: "number", defaultValue: 100 },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      required: false,
    },
  ],
  indexes: [
    {
      fields: ["category", "slug"],
      unique: true,
    },
  ],
};
