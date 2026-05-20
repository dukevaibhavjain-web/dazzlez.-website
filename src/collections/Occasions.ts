import type { CollectionConfig } from "payload";

export const Occasions: CollectionConfig = {
  slug: "occasions",
  labels: { singular: "Occasion", plural: "Occasions" },
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
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      required: false,
    },
  ],
};
