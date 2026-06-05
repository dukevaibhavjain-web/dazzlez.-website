import type { CollectionConfig } from "payload";

export const KeywordBank: CollectionConfig = {
  slug: "keyword-bank",
  labels: {
    singular: "Keyword",
    plural: "Keywords",
  },
  admin: {
    useAsTitle: "keyword",
    group: "Blog",
    defaultColumns: ["keyword", "searchIntent", "volume", "approved", "blogUsed"],
  },
  access: {
    read: () => true, // Public read for discovery engine
    create: () => false, // Only API can create
    update: (args) => args.req.user !== undefined, // Admin only
    delete: (args) => args.req.user !== undefined, // Admin only
  },
  fields: [
    {
      name: "keyword",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "searchIntent",
      type: "select",
      required: true,
      options: [
        { label: "Informational", value: "informational" },
        { label: "Transactional", value: "transactional" },
        { label: "Navigational", value: "navigational" },
        { label: "Commercial", value: "commercial" },
      ],
      index: true,
    },
    {
      name: "volume",
      type: "select",
      options: [
        { label: "High", value: "high" },
        { label: "Medium", value: "medium" },
        { label: "Low", value: "low" },
      ],
    },
    {
      name: "difficulty",
      type: "select",
      options: [
        { label: "High", value: "high" },
        { label: "Medium", value: "medium" },
        { label: "Low", value: "low" },
      ],
    },
    {
      name: "relatedCategory",
      type: "relationship",
      relationTo: "categories",
      admin: {
        description: "Product category this keyword relates to.",
      },
    },
    {
      name: "relatedOccasion",
      type: "relationship",
      relationTo: "occasions",
      admin: {
        description: "Occasion this keyword relates to (e.g., anniversary, engagement).",
      },
    },
    {
      name: "blogUsed",
      type: "relationship",
      relationTo: "blogs",
      admin: {
        description: "Blog post this keyword was used for (auto-set on content generation).",
      },
    },
    {
      name: "source",
      type: "select",
      required: true,
      defaultValue: "product_catalog",
      options: [
        { label: "Product Catalog", value: "product_catalog" },
        { label: "Occasion", value: "occasion" },
        { label: "AI Expanded", value: "ai_expanded" },
        { label: "Manual", value: "manual" },
      ],
      admin: {
        description: "How this keyword was discovered.",
      },
    },
    {
      name: "approved",
      type: "checkbox",
      defaultValue: false,
      index: true,
      admin: {
        description: "Admin must approve before content generation.",
      },
    },
  ],

  timestamps: true,
};
