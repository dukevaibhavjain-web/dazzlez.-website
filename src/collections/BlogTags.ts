import type { CollectionConfig } from "payload";

export const BlogTags: CollectionConfig = {
  slug: "blog-tags",
  labels: {
    singular: "Blog Tag",
    plural: "Blog Tags",
  },
  admin: {
    useAsTitle: "name",
    group: "Blog",
  },
  access: {
    read: () => true, // Public read for filtering
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "Auto-generated from name.",
      },
    },
  ],
};
