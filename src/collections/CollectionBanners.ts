import type { CollectionConfig } from "payload";

/**
 * CollectionBanners — full-width hero banner per collection page.
 *
 * Images are uploaded via the /upload admin tool, then the URL is pasted
 * into the imageUrl field here. This avoids Payload's built-in upload widget.
 *
 * Only one banner should be active per category at a time; the data helper
 * picks the most-recently-updated active banner for the given category.
 */
export const CollectionBanners: CollectionConfig = {
  slug: "collection-banners",
  labels: { singular: "Collection Banner", plural: "Collection Banners" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["category", "title", "overlayOpacity", "active"],
    group: "Collections",
    description:
      "Hero banner shown at the top of each collection page. " +
      "Upload your image at /upload, copy the URL, then paste it into Image URL below.",
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
      admin: { description: "Large heading displayed over the image." },
    },
    {
      name: "subtitle",
      type: "text",
      admin: { description: "Smaller line shown below the title (tagline or promo)." },
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "Optional short paragraph below the subtitle.",
        rows: 2,
      },
    },
    {
      name: "imageUrl",
      type: "text",
      required: true,
      admin: {
        description:
          "Desktop banner image URL (from /upload). Recommended: 1400 × 500 px landscape.",
      },
    },
    {
      name: "mobileImageUrl",
      type: "text",
      admin: {
        description:
          "Optional separate image for mobile screens — shown on screens ≤ 640 px wide. " +
          "Upload a portrait/square crop at /upload and paste the URL here. " +
          "If left blank, the desktop image is used on all screen sizes.",
      },
    },
    {
      name: "overlayOpacity",
      type: "select",
      defaultValue: "30",
      admin: {
        description:
          "Dark overlay applied on top of the image so text stays readable. " +
          "Increase if your image is light-coloured.",
      },
      options: [
        { label: "None (0%)", value: "0" },
        { label: "Subtle (15%)", value: "15" },
        { label: "Medium (30%)", value: "30" },
        { label: "Dark (50%)", value: "50" },
        { label: "Darker (65%)", value: "65" },
      ],
    },
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
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Uncheck to hide this banner without deleting it." },
    },
  ],
};
