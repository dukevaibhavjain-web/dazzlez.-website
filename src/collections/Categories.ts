import type { CollectionConfig } from "payload";

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: { singular: "Category", plural: "Categories" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "sortOrder"],
    group: "Catalog",
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: "name", type: "text", required: true, unique: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "URL-safe identifier, e.g. 'rings', 'earrings'." },
    },
    { name: "sortOrder", type: "number", defaultValue: 100 },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      required: false,
    },
    { name: "shortDescription", type: "text" },
  ],
};
