import type { CollectionConfig } from "payload";

/**
 * CollectionMarketingTiles — full-width promotional tiles injected into the
 * product grid at configurable positions.
 *
 * The imageUrl field uses the inline ImageUploadField component so editors can
 * drag-drop, browse, or paste a URL directly in Payload admin.
 *
 * Each tile appears spanning the full grid width after the Nth product.
 * Example: insertAfterNthProduct = 6 → tile appears between the 6th and 7th
 * product cards. Multiple tiles at the same position are sorted by displayOrder.
 */
export const CollectionMarketingTiles: CollectionConfig = {
  slug: "collection-marketing-tiles",
  labels: { singular: "Marketing Tile", plural: "Marketing Tiles" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["category", "title", "insertAfterNthProduct", "displayOrder", "active"],
    group: "Collections",
    description:
      "Full-width promotional tiles inserted into the product grid at configurable positions. " +
      "Drag & drop an image (or paste a URL) directly into the Image field below.",
  },
  access: { read: () => true },
  fields: [
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: true,
      index: true,
      admin: { description: "Which collection page should this tile appear on?" },
    },
    {
      name: "title",
      type: "text",
      required: true,
      admin: { description: "Tile heading." },
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "Short body text — keep under 120 characters for best display.",
        rows: 3,
      },
    },
    {
      name: "imageUrl",
      type: "text",
      admin: {
        description: "Tile image. Recommended: 600 × 400 px. Drag & drop, browse, or paste a URL.",
        components: {
          Field: {
            path: "@/components/admin/ImageUploadField",
            exportName: "ImageUploadField",
          },
        },
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "ctaText",
          type: "text",
          admin: { width: "50%", description: "Button label — e.g. 'Try at Home'" },
        },
        {
          name: "ctaLink",
          type: "text",
          admin: { width: "50%", description: "Button URL" },
        },
      ],
    },
    {
      name: "backgroundColor",
      type: "select",
      defaultValue: "cream",
      admin: { description: "Tile background colour." },
      options: [
        { label: "Cream (default)", value: "cream" },
        { label: "Warm White", value: "white" },
        { label: "Blush Pink", value: "blush" },
        { label: "Sage Green", value: "sage" },
        { label: "Dusty Blue", value: "blue" },
        { label: "Navy (dark)", value: "navy" },
        { label: "Gold Tint", value: "gold" },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "insertAfterNthProduct",
          type: "number",
          defaultValue: 6,
          min: 1,
          admin: {
            width: "50%",
            description:
              "Insert this tile after the Nth product. " +
              "E.g. 6 = appears between product 6 and 7.",
          },
        },
        {
          name: "displayOrder",
          type: "number",
          defaultValue: 0,
          admin: {
            width: "50%",
            description:
              "If multiple tiles share the same position, lower number = shown first.",
          },
        },
      ],
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Uncheck to hide this tile without deleting it." },
    },
  ],
};
