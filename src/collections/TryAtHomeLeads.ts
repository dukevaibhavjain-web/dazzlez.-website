import type { CollectionConfig } from "payload";

/**
 * Try at Home Leads — CRM collection for home-trial requests.
 * Submissions arrive from the TryAtHomeCard form on the PDP.
 * Admin views and updates status directly in the Payload dashboard.
 */
export const TryAtHomeLeads: CollectionConfig = {
  slug: "try-at-home-leads",
  admin: {
    useAsTitle: "customerName",
    defaultColumns: ["customerName", "phone", "city", "productCode", "status", "createdAt"],
    group: "CRM",
    description: "Home-trial leads from the 'Try at Home' card on product pages.",
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true,   // public form submission (via local API route)
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    // ── Customer details ──────────────────────────────────────────────
    {
      type: "row",
      fields: [
        {
          name: "customerName",
          type: "text",
          required: true,
          label: "Name",
          admin: { width: "40%" },
        },
        {
          name: "phone",
          type: "text",
          required: true,
          admin: { width: "30%" },
        },
        {
          name: "email",
          type: "email",
          admin: { width: "30%" },
        },
      ],
    },
    {
      name: "address",
      type: "textarea",
      required: true,
      admin: { rows: 2 },
    },
    {
      type: "row",
      fields: [
        { name: "city",    type: "text", admin: { width: "34%" } },
        { name: "state",   type: "text", admin: { width: "33%" } },
        { name: "pincode", type: "text", admin: { width: "33%" } },
      ],
    },
    // ── Product context ───────────────────────────────────────────────
    {
      type: "row",
      fields: [
        {
          name: "productCode",
          type: "text",
          label: "Product Code",
          admin: { width: "25%", description: "e.g. RR-052" },
        },
        {
          name: "productName",
          type: "text",
          label: "Product Name",
          admin: { width: "75%", readOnly: true },
        },
      ],
    },
    // ── CRM fields ────────────────────────────────────────────────────
    {
      name: "status",
      type: "select",
      defaultValue: "new",
      options: [
        { label: "🆕 New",              value: "new" },
        { label: "📞 Contacted",        value: "contacted" },
        { label: "📅 Visit Scheduled",  value: "scheduled" },
        { label: "✅ Converted",        value: "converted" },
        { label: "❌ Not Interested",   value: "rejected" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    // ── Chatbot / Design Advisor fields ──────────────────────────────
    {
      name: "leadSource",
      type: "select",
      label: "Lead Source",
      defaultValue: "try-at-home",
      options: [
        { label: "Try at Home form",   value: "try-at-home" },
        { label: "AI Design Advisor",  value: "design-advisor" },
        { label: "AI Chat Escalation", value: "ai-chat" },
        { label: "Other",              value: "other" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "referenceImages",
      type: "array",
      label: "Reference Images",
      admin: {
        description: "Customer-uploaded reference images from the Design Advisor",
      },
      fields: [
        {
          name: "url",
          type: "text",
          required: true,
          label: "Image URL",
          admin: {
            description: "Click to open the image in a new tab",
          },
        },
      ],
    },
    {
      name: "adminNotes",
      type: "textarea",
      label: "Admin Notes",
      admin: {
        description: "Internal notes — not visible to the customer",
        rows: 3,
      },
    },
  ],
};
