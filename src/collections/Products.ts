import type { CollectionConfig } from "payload";

/**
 * Products — one row per design (style code).
 *
 * Recipe is EMBEDDED: metals/diamonds/colorStones live as arrays inside the
 * product. One product can be sold in many configurations (metal purity ×
 * diamond category × ring size × solitaire carat) — those variants are
 * computed at request-time by the pricing engine, not stored as separate rows.
 */
export const Products: CollectionConfig = {
  slug: "products",
  labels: { singular: "Product", plural: "Products" },
  admin: {
    useAsTitle: "displayName",
    defaultColumns: ["code", "displayName", "category", "status"],
    group: "Catalog",
    // Search across both code (RR-001) and the user-facing name
    listSearchableFields: ["code", "displayName", "slug"],
  },
  access: { read: () => true },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "code",
          type: "text",
          required: true,
          unique: true,
          index: true,
          admin: {
            width: "30%",
            description: "Style code, e.g. 'ER-001'. Natural key for imports + image folder lookup.",
          },
        },
        {
          name: "status",
          type: "select",
          defaultValue: "draft",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Active", value: "active" },
            { label: "Archived", value: "archived" },
          ],
          admin: { width: "20%" },
        },
        {
          name: "slug",
          type: "text",
          index: true,
          admin: { width: "50%", description: "Auto-derived from code if blank." },
        },
      ],
    },
    {
      name: "displayName",
      type: "text",
      required: true,
      admin: { description: "Customer-facing title. e.g. 'Cushion Cut Halo Engagement Ring'." },
    },
    { name: "description", type: "textarea" },
    {
      type: "row",
      fields: [
        { name: "category", type: "relationship", relationTo: "categories", required: true, admin: { width: "33%" } },
        { name: "subCategory", type: "relationship", relationTo: "sub-categories", admin: { width: "33%" } },
        { name: "primaryShape", type: "relationship", relationTo: "shapes", admin: { width: "33%" } },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "isSolitaire",
          type: "checkbox",
          defaultValue: false,
          admin: { width: "50%", description: "If true, customer can pick 1ct / 2ct / 3ct diamond size variants." },
        },
        {
          name: "isRing",
          type: "checkbox",
          defaultValue: false,
          admin: { width: "50%", description: "If true, customer picks ring size (US 4–13). Auto-set on save if category=Rings." },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "fulfillmentType",
          type: "select",
          required: true,
          defaultValue: "made_to_order",
          options: [
            { label: "Made to Order (price is an estimate)", value: "made_to_order" },
            { label: "Ready Stock (price confirmed, ships fast)", value: "ready_stock" },
          ],
          admin: { width: "60%" },
        },
        {
          name: "stockQuantity",
          type: "number",
          defaultValue: 0,
          admin: {
            width: "40%",
            description: "Units available. Only used for Ready Stock.",
            condition: (data) => data?.fulfillmentType === "ready_stock",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "heroImage", type: "upload", relationTo: "media", admin: { width: "70%" } },
        {
          name: "defaultGoldColor",
          type: "select",
          defaultValue: "yellow",
          options: [
            { label: "Yellow Gold", value: "yellow" },
            { label: "White Gold", value: "white" },
            { label: "Rose Gold", value: "rose" },
          ],
          admin: {
            width: "30%",
            description:
              "Which gold color variant to show by default on the storefront. " +
              "Gold → Yellow, Silver/Platinum → White. Override per-product if needed.",
          },
        },
      ],
    },
    {
      name: "gallery",
      type: "array",
      labels: { singular: "Image", plural: "Images" },
      admin: {
        description:
          "All product images. Tag each with its gold color so the storefront " +
          "gallery switches images when the customer picks Yellow / White / Rose Gold. " +
          "Leave color as 'Any' for lifestyle/model shots that look good in all variants.",
      },
      fields: [
        { name: "image", type: "upload", relationTo: "media", required: true },
        {
          name: "goldColor",
          type: "select",
          defaultValue: "",
          options: [
            { label: "Any (lifestyle / color-agnostic)", value: "" },
            { label: "Yellow Gold", value: "yellow" },
            { label: "White Gold  (also used for Silver & Platinum)", value: "white" },
            { label: "Rose Gold", value: "rose" },
          ],
          admin: {
            description: "Which gold color variant this image represents.",
          },
        },
      ],
    },
    {
      name: "imageManager",
      type: "ui",
      admin: {
        components: {
          Field: "@/components/admin/ProductImageManager",
        },
      },
    },
    {
      name: "publishActions",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field: "@/components/admin/ProductPublishButton",
        },
      },
    },
    {
      name: "fromPriceInr",
      type: "number",
      index: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "Cheapest variant (9K + Lab Standard), incl. GST. Auto-computed by `pnpm refresh:prices`. Drives collection filtering + sorting.",
      },
    },
    {
      name: "pricePreview",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field: "@/components/admin/ProductPricePreview",
        },
      },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Metals",
          description: "Weight in grams per available purity. Customer picks one at checkout.",
          fields: [
            {
              name: "metals",
              type: "array",
              fields: [
                {
                  name: "purity",
                  type: "select",
                  required: true,
                  options: [
                    { label: "9K", value: "9K" },
                    { label: "14K", value: "14K" },
                    { label: "18K", value: "18K" },
                    { label: "22K", value: "22K" },
                    { label: "Silver 925", value: "Silver925" },
                    { label: "Platinum", value: "Platinum" },
                  ],
                },
                {
                  name: "weightG",
                  type: "number",
                  required: true,
                  admin: { description: "Grams of metal at this purity." },
                },
              ],
            },
          ],
        },
        {
          label: "Diamonds",
          description: "Each row = a group of stones. 'Small' = pavé/pointer; 'Solitaire' = center stone.",
          fields: [
            {
              name: "diamonds",
              type: "array",
              fields: [
                {
                  name: "role",
                  type: "select",
                  required: true,
                  defaultValue: "small",
                  options: [
                    { label: "Small (pointer / pavé)", value: "small" },
                    { label: "Solitaire (center stone)", value: "solitaire" },
                  ],
                },
                { name: "shape", type: "relationship", relationTo: "shapes" },
                { name: "sizeMm", type: "text", admin: { description: "Stone dimensions, e.g. '1.85*1.85' or '6.00*4.00'." } },
                {
                  name: "weightCt",
                  type: "number",
                  required: true,
                  admin: { description: "Total carat weight (sum of all stones in this row)." },
                },
                { name: "count", type: "number", required: true, defaultValue: 1 },
                { name: "cut", type: "text" },
                { name: "color", type: "text" },
                { name: "clarity", type: "text" },
              ],
            },
          ],
        },
        {
          label: "Color Stones",
          fields: [
            {
              name: "colorStones",
              type: "array",
              fields: [
                { name: "stone", type: "relationship", relationTo: "color-stones", required: true },
                { name: "weightCt", type: "number", required: true },
                { name: "count", type: "number", required: true, defaultValue: 1 },
              ],
            },
          ],
        },
        {
          label: "Notes",
          fields: [
            { name: "designerNotes", type: "textarea" },
            { name: "remarks", type: "text" },
          ],
        },
        {
          label: "Match & Shine",
          description:
            "Products shown in the 'Match & Shine — Complete the Look' section on this product's PDP. Pick 2–3 pieces that complement this design in metal, style, or occasion.",
          fields: [
            {
              name: "complementaryProducts",
              type: "relationship",
              relationTo: "products",
              hasMany: true,
              admin: {
                components: {
                  Field: "@/components/admin/ProductComplementaryPicker",
                },
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-slug: SEO/AI-friendly name + code (name carries keywords, code
        // guarantees uniqueness). Admin can override by setting slug manually.
        if (data?.code && !data.slug) {
          const slugify = (s: string) =>
            String(s)
              .normalize("NFKD")
              .replace(/[̀-ͯ]/g, "") // strip diacritics: é → e, ñ → n
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");
          const codeSlug = slugify(data.code);
          const nameSlug = data.displayName ? slugify(data.displayName) : "";
          data.slug = nameSlug ? `${nameSlug}-${codeSlug}` : codeSlug;
        }
        return data;
      },
    ],
  },
};
