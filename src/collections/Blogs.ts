import type { CollectionConfig } from "payload";

export const Blogs: CollectionConfig = {
  slug: "blogs",
  labels: {
    singular: "Blog Post",
    plural: "Blog Posts",
  },
  admin: {
    useAsTitle: "title",
    group: "Blog",
    defaultColumns: ["title", "status", "publishedAt", "category", "viewCount"],
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${doc.slug}`,
  },
  access: {
    read: ({ doc }) => {
      // Public can read published blogs
      if (doc?.status === "published") return true;
      // Admin can read all
      return true;
    },
    create: (args) => args.req.user !== undefined, // Admin only
    update: (args) => args.req.user !== undefined, // Admin only
    delete: (args) => args.req.user !== undefined, // Admin only
  },
  fields: [
    {
      name: "title",
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
        description: "URL-friendly slug. Auto-generated from title if empty.",
      },
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (!data.slug && data.title) {
              data.slug = data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            }
            return data;
          },
        ],
      },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Pending Approval", value: "pending_approval" },
        { label: "Scheduled", value: "scheduled" },
        { label: "Published", value: "published" },
      ],
      index: true,
      admin: {
        description: "Draft → Pending Approval → Scheduled → Published",
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      required: true,
      maxLength: 500,
      admin: {
        description: "2-3 sentence summary. Used on listing page and as fallback meta description.",
      },
    },
    {
      name: "body",
      type: "richText",
      required: true,
      editor: "lexical",
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "blog-categories",
      required: true,
      index: true,
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "blog-tags",
      hasMany: true,
    },
    {
      name: "linkedProducts",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      admin: {
        description: "Products mentioned in this blog. Used for product cards inline and in sidebar.",
      },
    },
    {
      name: "linkedCollections",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      admin: {
        description: "Product collections mentioned in this blog (e.g., Rings, Earrings).",
      },
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Blog cover image. If not set, placeholder is shown.",
      },
    },
    {
      name: "heroImageSvg",
      type: "textarea",
      admin: {
        description: "SVG markup for hero image (alternative to upload). Set if Claude text-rendering was used.",
      },
    },
    {
      name: "readingTimeMinutes",
      type: "number",
      admin: {
        description: "Auto-computed from body text word count.",
        readOnly: true,
      },
    },
    {
      name: "viewCount",
      type: "number",
      defaultValue: 0,
      admin: {
        description: "Incremented by analytics events. Read-only.",
        readOnly: true,
      },
    },
    {
      name: "metaTitle",
      type: "text",
      admin: {
        description: "SEO title tag. Falls back to title if blank.",
      },
    },
    {
      name: "metaDescription",
      type: "textarea",
      maxLength: 160,
      admin: {
        description: "SEO meta description. Max 160 chars.",
      },
    },
    {
      name: "focusKeyword",
      type: "text",
      admin: {
        description: "Primary SEO keyword for this blog. Used in schema markup.",
      },
    },
    {
      name: "keywords",
      type: "array",
      fields: [
        {
          name: "keyword",
          type: "text",
          required: true,
        },
        {
          name: "searchIntent",
          type: "select",
          options: [
            { label: "Informational", value: "informational" },
            { label: "Transactional", value: "transactional" },
            { label: "Navigational", value: "navigational" },
            { label: "Commercial", value: "commercial" },
          ],
        },
      ],
      maxRows: 10,
      admin: {
        description: "Related keywords for SEO. Max 10.",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      index: true,
      admin: {
        description: "When this blog was published. Auto-set when status → published.",
      },
    },
    {
      name: "scheduledFor",
      type: "date",
      admin: {
        description: "Scheduled publish time. Used by cron to auto-publish.",
      },
    },
    {
      name: "abTestSlot",
      type: "select",
      options: [
        { label: "9:00 AM", value: "9am" },
        { label: "2:00 PM", value: "2pm" },
        { label: "7:00 PM", value: "7pm" },
      ],
      index: true,
      admin: {
        description: "A/B testing slot (publish time). Auto-assigned by scheduler.",
      },
    },
    {
      name: "publishingHistory",
      type: "array",
      fields: [
        {
          name: "publishedAt",
          type: "date",
        },
        {
          name: "abTestSlot",
          type: "text",
        },
        {
          name: "viewCount",
          type: "number",
        },
        {
          name: "engagementScore",
          type: "number",
          admin: {
            description: "Composite score: (scrollDepth * 0.4) + (timeOnPage * 0.4) + (productClick * 0.2)",
          },
        },
      ],
      admin: {
        description: "Historical record of each publish attempt and performance.",
      },
    },
    {
      name: "aiGenerationMeta",
      type: "json",
      admin: {
        description: "Metadata about AI generation (model, prompt hash, keyword used). For auditability.",
      },
    },
  ],

  timestamps: true,
  indexes: ["status", "publishedAt", "slug", "category", "abTestSlot"],
};
