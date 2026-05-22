import type { CollectionConfig } from "payload";

/**
 * Reviews — customer reviews tied to a product.
 *
 * Reviews are seeded via `pnpm seed:reviews` and can be managed
 * (approved / rejected) from the Payload admin panel.
 *
 * Access: publicly readable (approved only enforced in queries).
 * Only admin can create / update / delete via the local API.
 */
export const Reviews: CollectionConfig = {
  slug: "reviews",
  labels: { singular: "Review", plural: "Reviews" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["product", "rating", "authorName", "approved", "reviewDate"],
    group: "Catalog",
    listSearchableFields: ["authorName", "title", "body"],
  },
  access: { read: () => true },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
          index: true,
          admin: { width: "70%" },
        },
        {
          name: "rating",
          type: "number",
          required: true,
          min: 1,
          max: 5,
          admin: { width: "30%", description: "1–5 stars" },
        },
      ],
    },
    { name: "title", type: "text", required: true },
    { name: "body", type: "textarea", required: true },
    {
      type: "row",
      fields: [
        { name: "authorName", type: "text", required: true, admin: { width: "50%" } },
        {
          name: "reviewDate",
          type: "date",
          admin: {
            width: "30%",
            description: "Date shown on storefront. Defaults to creation date.",
            date: { displayFormat: "dd MMM yyyy" },
          },
        },
        {
          name: "verified",
          type: "checkbox",
          defaultValue: true,
          admin: { width: "10%", description: "Verified purchase" },
        },
        {
          name: "approved",
          type: "checkbox",
          defaultValue: true,
          admin: { width: "10%", description: "Show publicly" },
        },
      ],
    },
  ],
};
