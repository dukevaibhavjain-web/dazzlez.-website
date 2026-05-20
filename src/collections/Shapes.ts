import type { CollectionConfig } from "payload";

export const Shapes: CollectionConfig = {
  slug: "shapes",
  labels: { singular: "Diamond Shape", plural: "Diamond Shapes" },
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
    },
    { name: "sortOrder", type: "number", defaultValue: 100 },
    {
      name: "icon",
      type: "upload",
      relationTo: "media",
      required: false,
      admin: { description: "Small SVG icon shown in 'Shop by Shape'." },
    },
  ],
};
