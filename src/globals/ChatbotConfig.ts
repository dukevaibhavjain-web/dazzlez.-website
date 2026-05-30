import type { Block, GlobalConfig } from "payload";

/**
 * ChatbotConfig — visual flow builder for the Design Advisor questionnaire.
 *
 * Admin → Storefront → Design Advisor — Chatbot Flow
 *
 * Replaces fixed tabs with a dynamic `steps` blocks array so editors can
 * add/remove/reorder steps and see a live flow preview. Each option can
 * route to any other step by key, enabling arbitrary branching.
 *
 * Changes take effect within ~1 minute (Next.js ISR revalidation).
 */

// ── Block: Choice Step ────────────────────────────────────────────────────────

const ChoiceStepBlock: Block = {
  slug: "choiceStep",
  labels: { singular: "Choice Step", plural: "Choice Steps" },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "stepKey",
          type: "text",
          label: "Step Key",
          required: true,
          admin: {
            width: "35%",
            description:
              "Unique identifier used in 'Go to Step' fields (e.g. 'occasion', 'budget'). No spaces.",
          },
        },
        {
          name: "questionText",
          type: "text",
          label: "Question Heading",
          required: true,
          admin: { width: "65%" },
        },
      ],
    },
    {
      name: "subtitle",
      type: "text",
      label: "Subtitle",
    },
    {
      name: "options",
      type: "array",
      label: "Options",
      minRows: 1,
      admin: {
        description:
          "Each row is a tappable button. 'Go to Step' must match another step's key, or use __results__ (show product grid) or __contact__ (show lead form only).",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
              admin: { width: "28%" },
            },
            {
              name: "emoji",
              type: "text",
              admin: { width: "8%" },
            },
            {
              name: "goToStepKey",
              type: "text",
              label: "Go to Step",
              admin: {
                width: "20%",
                description: "e.g. 'budget' or '__results__'",
              },
            },
            {
              name: "categorySlug",
              type: "select",
              label: "Category",
              admin: { width: "22%" },
              options: [
                { label: "Rings",                value: "rings"     },
                { label: "Necklaces / Pendants", value: "necklaces" },
                { label: "Earrings",             value: "earrings"  },
                { label: "Bracelets",            value: "bracelets" },
                { label: "None (show all)",      value: ""          },
              ],
            },
            {
              name: "behavior",
              type: "select",
              label: "Behavior",
              defaultValue: "normal",
              admin: { width: "22%" },
              options: [
                { label: "Show results",  value: "normal"      },
                { label: "Skip to chat",  value: "prefer-chat" },
              ],
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "minPrice",
              type: "number",
              defaultValue: 0,
              admin: { width: "15%", description: "₹ min (0 = none)" },
            },
            {
              name: "maxPrice",
              type: "number",
              defaultValue: 0,
              admin: { width: "15%", description: "₹ max (0 = none)" },
            },
            {
              name: "waStyle",
              type: "select",
              label: "WA Tone",
              defaultValue: "standard",
              admin: {
                width: "25%",
                description: "Pre-filled WhatsApp message style",
              },
              options: [
                { label: "Standard",    value: "standard"  },
                { label: "Has reference", value: "reference" },
                { label: "Expert eye",  value: "expert"    },
                { label: "Describe",    value: "describe"  },
              ],
            },
            {
              name: "pixelEvent",
              type: "text",
              label: "Pixel Event",
              admin: {
                width: "20%",
                description: 'Custom event name, e.g. "WeddingRingChosen"',
              },
            },
            {
              name: "pixelParams",
              type: "textarea",
              label: "Pixel Params (JSON)",
              admin: {
                width: "25%",
                rows: 1,
                description: 'e.g. {"occasion":"Wedding"}',
              },
            },
          ],
        },
      ],
    },
  ],
};

// ── Block: Describe Step ──────────────────────────────────────────────────────

const DescribeStepBlock: Block = {
  slug: "describeStep",
  labels: { singular: "Describe Step", plural: "Describe Steps" },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "stepKey",
          type: "text",
          label: "Step Key",
          required: true,
          admin: { width: "35%", description: "Unique identifier, e.g. 'describe'" },
        },
        {
          name: "questionText",
          type: "text",
          label: "Question Heading",
          required: true,
          admin: { width: "65%" },
        },
      ],
    },
    {
      name: "subtitle",
      type: "text",
      label: "Subtitle",
    },
    {
      name: "placeholder",
      type: "textarea",
      label: "Textarea placeholder",
      admin: { rows: 3 },
      defaultValue:
        "E.g. \"A dainty rose-gold ring with a small oval diamond for my wife's birthday — she loves minimalist jewellery and wears it daily.\"",
    },
    {
      name: "hints",
      type: "array",
      label: "Quick-tap hint chips",
      admin: {
        description:
          "Small chips the customer can tap to auto-append words to their description. Include emoji in the label if you want.",
      },
      defaultValue: [
        { label: "✦ Minimalist"         },
        { label: "💫 Statement piece"   },
        { label: "👑 Classic / Traditional" },
        { label: "🌸 Modern"            },
        { label: "🔮 Vintage style"     },
        { label: "🌿 Lab-grown diamond" },
        { label: "💛 Natural diamond"   },
      ],
      fields: [
        { name: "label", type: "text", required: true },
      ],
    },
    {
      name: "goToStepKey",
      type: "text",
      label: "Go to Step (after submitting)",
      defaultValue: "__results__",
      admin: {
        description: "Step key to navigate to after the customer submits. Usually '__results__'.",
      },
    },
  ],
};

// ── Block: Upload Step ────────────────────────────────────────────────────────

const UploadStepBlock: Block = {
  slug: "uploadStep",
  labels: { singular: "Upload Step", plural: "Upload Steps" },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "stepKey",
          type: "text",
          label: "Step Key",
          required: true,
          admin: { width: "35%", description: "Unique identifier, e.g. 'upload'" },
        },
        {
          name: "questionText",
          type: "text",
          label: "Question Heading",
          required: true,
          admin: { width: "65%" },
          defaultValue: "Upload your reference",
        },
      ],
    },
    {
      name: "subtitle",
      type: "text",
      label: "Subtitle",
      defaultValue:
        "Share up to 3 images — our advisor will reach out based on your style.",
    },
    {
      name: "goToStepKey",
      type: "text",
      label: "Go to Step (after uploading)",
      defaultValue: "__results__",
      admin: {
        description: "Step key to navigate to after the customer continues. Usually '__results__'.",
      },
    },
  ],
};

// ── Global config ─────────────────────────────────────────────────────────────

export const ChatbotConfig: GlobalConfig = {
  slug: "chatbot-config",
  label: "Design Advisor — Chatbot Flow",
  admin: {
    description:
      "Build the Design Advisor questionnaire by adding, removing, and reordering steps. Each step can route to any other by Step Key. Changes go live within ~1 minute.",
    group: "Storefront",
  },
  access: {
    read:   () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "entryStepKey",
      type: "text",
      label: "Entry Step Key",
      defaultValue: "occasion",
      admin: {
        description:
          "The Step Key of the first step shown to the customer. Default: 'occasion'.",
      },
    },
    {
      // Live visual flow preview — updates as you edit blocks below
      type: "ui",
      name: "flowPreview",
      admin: {
        components: {
          Field: "@/components/admin/FlowPreview",
        },
      },
    },
    {
      name: "steps",
      type: "blocks",
      label: "Flow Steps",
      minRows: 1,
      blocks: [ChoiceStepBlock, DescribeStepBlock, UploadStepBlock],
      admin: {
        description:
          "Add blocks to build your questionnaire. Drag to reorder. Use 'Choice Step' for button grids, 'Describe Step' for free-text input, 'Upload Step' for image uploads. Use '__results__' or '__contact__' in 'Go to Step' fields to terminate the flow.",
        initCollapsed: false,
      },
    },
  ],
};
