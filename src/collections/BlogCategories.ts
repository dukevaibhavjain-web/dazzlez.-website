import type { CollectionConfig } from "payload";

export const BlogCategories: CollectionConfig = {
  slug: "blog-categories",
  labels: {
    singular: "Blog Category",
    plural: "Blog Categories",
  },
  admin: {
    useAsTitle: "name",
    group: "Blog",
  },
  access: {
    read: () => true, // Public read for navigation
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "Auto-generated from name. Used in URL and filters.",
      },
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      admin: {
        description: "Lower numbers appear first in blog category navigation.",
      },
    },
  ],
};
