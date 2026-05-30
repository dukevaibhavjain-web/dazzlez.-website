import type { GlobalConfig, Block } from "payload";

/**
 * HomePage global — CMS-driven homepage section builder.
 *
 * Editors can add, remove, and drag-to-reorder any of the 6 block types.
 * Images use the same inline ImageUploadField widget as CollectionBanners.
 */

// ── Reusable image field helper ─────────────────────────────────────────────
const imageField = (name: string, description: string, required = false) => ({
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

// ── Block: Hero Banner ───────────────────────────────────────────────────────
const HeroBannerBlock: Block = {
  slug: "hero-banner",
  labels: { singular: "Hero Banner", plural: "Hero Banners" },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
      admin: { description: "Main headline text." },
    },
    {
      name: "subheading",
      type: "textarea",
      admin: { description: "Optional paragraph below the headline.", rows: 2 },
    },
    imageField(
      "imageUrl",
      "Desktop hero image. Recommended: 1400 × 600 px. Drag & drop, browse, or paste a URL.",
    ),
    imageField(
      "mobileImageUrl",
      "Optional portrait crop for phones (≤ 640 px). Recommended: 640 × 800 px. Falls back to desktop image.",
    ),
    {
      name: "backgroundColor",
      type: "select",
      defaultValue: "navy",
      options: [
        { label: "Navy (dark)", value: "navy" },
        { label: "Cream (light)", value: "cream" },
        { label: "White", value: "white" },
      ],
      admin: {
        description: "Background colour shown when no image is set, or as overlay fallback.",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "primaryCtaText",
          type: "text",
          admin: { width: "25%", description: "Primary button label — e.g. 'Shop Rings'" },
        },
        {
          name: "primaryCtaLink",
          type: "text",
          admin: { width: "25%", description: "Primary button URL — e.g. '/collections/rings'" },
        },
        {
          name: "secondaryCtaText",
          type: "text",
          admin: { width: "25%", description: "Secondary button label (optional)" },
        },
        {
          name: "secondaryCtaLink",
          type: "text",
          admin: { width: "25%", description: "Secondary button URL (optional)" },
        },
      ],
    },
    {
      name: "splitMode",
      type: "select",
      defaultValue: "full",
      options: [
        { label: "Full width hero", value: "full" },
        { label: "Left content · Right chat initiator", value: "split-chat" },
      ],
      admin: {
        description:
          "Split mode places the AI chat box on the right half of the hero. Works best with a background image.",
      },
    },
  ],
};

// ── Block: Category Grid ─────────────────────────────────────────────────────
const CategoryGridBlock: Block = {
  slug: "category-grid",
  labels: { singular: "Category Grid", plural: "Category Grids" },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      defaultValue: "Shop By",
      admin: { description: "Small uppercase label above the title." },
    },
    {
      name: "title",
      type: "text",
      required: true,
      defaultValue: "Category",
    },
    {
      name: "items",
      type: "array",
      minRows: 1,
      admin: { description: "Add one row per category card. Drag to reorder." },
      fields: [
        {
          name: "category",
          type: "relationship",
          relationTo: "categories",
          required: true,
        },
        imageField(
          "imageUrl",
          "Card background image. Recommended: 500 × 625 px (portrait). Falls back to navy gradient.",
        ),
        {
          name: "labelOverride",
          type: "text",
          admin: { description: "Override the category name shown on the card (optional)." },
        },
      ],
    },
  ],
};

// ── Block: Image Banner ──────────────────────────────────────────────────────
const ImageBannerBlock: Block = {
  slug: "image-banner",
  labels: { singular: "Image Banner", plural: "Image Banners" },
  fields: [
    imageField(
      "imageUrl",
      "Desktop banner image. Recommended: 1400 × 500 px. Drag & drop, browse, or paste a URL.",
      true,
    ),
    imageField(
      "mobileImageUrl",
      "Optional portrait crop for phones (≤ 640 px). Recommended: 640 × 800 px.",
    ),
    {
      name: "altText",
      type: "text",
      admin: { description: "Alt text for screen readers and SEO." },
    },
    {
      name: "link",
      type: "text",
      admin: { description: "Makes the entire banner clickable — e.g. '/collections/earrings'." },
    },
    {
      type: "row",
      fields: [
        {
          name: "overlayText",
          type: "text",
          admin: { width: "50%", description: "Optional heading overlaid on the image." },
        },
        {
          name: "ctaText",
          type: "text",
          admin: { width: "50%", description: "CTA button label shown on the overlay." },
        },
      ],
    },
  ],
};

// ── Block: Shape Grid ────────────────────────────────────────────────────────
const ShapeGridBlock: Block = {
  slug: "shape-grid",
  labels: { singular: "Shape Grid", plural: "Shape Grids" },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      defaultValue: "Shop By",
      admin: { description: "Small uppercase label above the title." },
    },
    {
      name: "title",
      type: "text",
      defaultValue: "Shape",
    },
    {
      name: "backgroundColor",
      type: "select",
      defaultValue: "cream",
      options: [
        { label: "Cream", value: "cream" },
        { label: "White", value: "white" },
        { label: "Navy (dark)", value: "navy" },
      ],
    },
    {
      name: "linkToCategory",
      type: "text",
      defaultValue: "/collections/rings",
      admin: {
        description:
          "Each shape chip links to this category URL with ?shape=<slug> appended — e.g. '/collections/rings'.",
      },
    },
  ],
};

// ── Block: Promise Strip ─────────────────────────────────────────────────────
const PromiseStripBlock: Block = {
  slug: "promise-strip",
  labels: { singular: "Promise Strip", plural: "Promise Strips" },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      admin: { description: "Optional small uppercase label above the title." },
    },
    {
      name: "title",
      type: "text",
      admin: { description: "Optional section heading." },
    },
    {
      name: "backgroundColor",
      type: "select",
      defaultValue: "white",
      options: [
        { label: "White", value: "white" },
        { label: "Cream", value: "cream" },
        { label: "Navy (dark)", value: "navy" },
      ],
    },
    {
      name: "items",
      type: "array",
      minRows: 1,
      admin: { description: "Each item is one column in the strip." },
      fields: [
        {
          name: "icon",
          type: "text",
          admin: {
            description:
              "Paste an emoji (e.g. ✦ 💎 ✓ ★). Windows: Win+.  •  Mac: Ctrl+Cmd+Space to open the emoji picker.",
          },
        },
        imageField(
          "iconUrl",
          "Optional: upload a small icon image (PNG/SVG, square ~64 px). Shown instead of the emoji above if both are set.",
        ),
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "description",
          type: "textarea",
          admin: { rows: 2 },
        },
      ],
    },
  ],
};

// ── Block: Featured Products ─────────────────────────────────────────────────
const FeaturedProductsBlock: Block = {
  slug: "featured-products",
  labels: { singular: "Featured Products", plural: "Featured Products" },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      defaultValue: "Handpicked For You",
      admin: { description: "Small uppercase label above the title." },
    },
    {
      name: "title",
      type: "text",
      required: true,
      defaultValue: "Featured Pieces",
    },
    {
      name: "items",
      type: "array",
      maxRows: 8,
      admin: { description: "Select up to 8 products to feature. Drag to reorder." },
      fields: [
        {
          // Step 1 — pick a category to narrow the product list
          name: "category",
          type: "relationship",
          relationTo: "categories",
          admin: {
            description: "Step 1 — Select a category to filter the products below.",
          },
        },
        {
          // Step 2 — pick a product (filtered by the selected category)
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          filterOptions: ({ siblingData }: { siblingData: any }) => {
            const base = { status: { not_equals: "archived" } };
            if (siblingData?.category) {
              return { and: [{ category: { equals: siblingData.category } }, base] };
            }
            return base;
          },
          admin: {
            description:
              "Step 2 — Pick a product. Selecting a category above narrows this list automatically.",
          },
        },
        {
          // Step 3 — optionally pin a specific metal variant
          name: "metal",
          type: "select",
          defaultValue: "",
          options: [
            { label: "Default (cheapest available)", value: "" },
            { label: "9K Gold", value: "9K" },
            { label: "14K Gold", value: "14K" },
            { label: "18K Gold", value: "18K" },
            { label: "22K Gold", value: "22K" },
            { label: "Silver 925", value: "Silver925" },
            { label: "Platinum", value: "Platinum" },
          ],
          admin: {
            description:
              "Step 3 — Optional: pin a specific metal so the card links directly to that variant on the PDP.",
          },
        },
      ],
    },
  ],
};

// ── Block: Customization Chat ────────────────────────────────────────────────
const CustomizationChatBlock: Block = {
  slug: "customization-chat",
  labels: { singular: "AI Customization Chat", plural: "AI Customization Chats" },
  fields: [
    {
      name: "heading",
      type: "text",
      defaultValue: "Find Your Perfect Piece",
      admin: { description: "Section heading shown above the chat initiator." },
    },
    {
      name: "subheading",
      type: "text",
      defaultValue: "Tell us what you're looking for — our AI advisor will help you find it.",
      admin: { description: "Short paragraph below the heading." },
    },
    {
      name: "placeholderText",
      type: "text",
      defaultValue: "E.g. 'A rose gold ring for my anniversary under ₹1 lakh'",
      admin: { description: "Placeholder text inside the chat input box." },
    },
    {
      name: "ctaLabel",
      type: "text",
      defaultValue: "Start Designing",
      admin: { description: "Label on the button that opens the chat." },
    },
    {
      name: "whatsappNumber",
      type: "text",
      defaultValue: "+919829115205",
      admin: {
        description:
          "WhatsApp number for human escalation (include country code, e.g. +919829115205).",
      },
    },
  ],
};

// ── Global ───────────────────────────────────────────────────────────────────
export const HomePage: GlobalConfig = {
  slug: "home-page",
  label: "Home Page",
  admin: {
    group: "Site",
    description:
      "Control every section on the homepage. Use '+ Add Block' to add a new section, and drag the handles to reorder them.",
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "sections",
      type: "blocks",
      blocks: [
        HeroBannerBlock,
        CategoryGridBlock,
        ImageBannerBlock,
        ShapeGridBlock,
        PromiseStripBlock,
        FeaturedProductsBlock,
        CustomizationChatBlock,
      ],
      admin: {
        description:
          "Each row is one section on the homepage. Drag to reorder. Leave empty to show the default layout.",
      },
    },
  ],
};
