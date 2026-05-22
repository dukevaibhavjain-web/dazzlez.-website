import type { CollectionConfig } from "payload";

/**
 * CollectionBanners — full-width hero banner per collection page.
 *
 * The imageUrl and mobileImageUrl fields use a custom inline upload widget
 * (ImageUploadField) so editors can drag-drop, browse, or paste a URL
 * directly inside the Payload admin — no separate /upload page needed.
 *
 * Only one banner should be active per category at a time; the data helper
 * picks the most-recently-updated active banner for the given category.
 */

const imageField = (name: string, label: string, description: string, required = false) => ({
  name,
  type: "text" as const,
  required,
  admin: {
    description,
    components: {
      Field: {
        path: "@/components/admin/ImageUploadField",
        exportName: "ImageUploadField",
      },
    },
  },
});

export const CollectionBanners: CollectionConfig = {
  slug: "collection-banners",
  labels: { singular: "Collection Banner", plural: "Collection Banners" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["category", "title", "active"],
    group: "Collections",
    description:
      "Hero banner shown at the top of each collection page. " +
      "Drag & drop an image (or paste a URL) directly into the Image fields below.",
  },
  access: { read: () => true },
  fields: [
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: true,
      index: true,
      admin: { description: "Which collection page should this banner appear on?" },
    },
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description:
          "Heading shown below the banner image. Appears as the page H1.",
      },
    },
    {
      name: "subtitle",
      type: "text",
      admin: { description: "Smaller tagline shown below the title." },
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "Optional short paragraph below the subtitle.",
        rows: 2,
      },
    },

    // ── Images ─────────────────────────────────────────────────────────────
    imageField(
      "imageUrl",
      "Desktop Image",
      "Desktop banner (landscape). Recommended: 1400 × 500 px. " +
        "Drag & drop, click to browse, or paste a URL.",
      true,
    ),
    imageField(
      "mobileImageUrl",
      "Mobile Image",
      "Optional portrait/square crop shown on screens ≤ 640 px wide. " +
        "Recommended: 640 × 800 px. Falls back to the desktop image if left empty. " +
        "Drag & drop, click to browse, or paste a URL.",
    ),

    // ── Optional CTA ───────────────────────────────────────────────────────
    {
      type: "row",
      fields: [
        {
          name: "ctaText",
          type: "text",
          admin: { width: "50%", description: "Button label — e.g. 'Shop Now'" },
        },
        {
          name: "ctaLink",
          type: "text",
          admin: {
            width: "50%",
            description: "Button destination — e.g. '/collections/rings'",
          },
        },
      ],
    },

    // ── Visibility ─────────────────────────────────────────────────────────
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Uncheck to hide this banner without deleting it." },
    },
  ],
};
