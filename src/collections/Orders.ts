import type { CollectionConfig } from "payload";

/**
 * Orders — transactional records created when a customer completes checkout.
 *
 * Payment is handled by Cashfree; this collection tracks the full lifecycle
 * from pending payment → manufacturing → delivery.
 *
 * Admin → CRM → Orders
 */
export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "orderId",
    defaultColumns: ["orderId", "customerName", "totalInr", "paymentStatus", "fulfillmentStatus", "createdAt"],
    group: "CRM",
    description: "Customer orders placed via checkout. Update fulfillment status as items move through production and dispatch.",
  },
  access: {
    // Customers can read their own orders (matched by email); admins see all
    read: ({ req }) => {
      if (req.user) return true; // admin user
      return false; // customer reads via API route only
    },
    create: () => true,  // created by /api/orders/create (overrideAccess)
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    // ── Identifiers ────────────────────────────────────────────────────
    {
      type: "row",
      fields: [
        {
          name: "orderId",
          type: "text",
          required: true,
          label: "Order ID",
          unique: true,
          admin: {
            width: "30%",
            description: "Auto-generated. e.g. DZ-2025-0001",
            readOnly: true,
          },
        },
        {
          name: "cashfreeOrderId",
          type: "text",
          label: "Cashfree Order ID",
          admin: {
            width: "40%",
            description: "Cashfree's order reference. Use for refunds.",
          },
        },
        {
          name: "cashfreePaymentId",
          type: "text",
          label: "Cashfree Payment ID",
          admin: { width: "30%" },
        },
      ],
    },

    // ── Status ─────────────────────────────────────────────────────────
    {
      name: "paymentStatus",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "⏳ Pending",    value: "pending"   },
        { label: "✅ Captured",   value: "captured"  },
        { label: "❌ Failed",     value: "failed"    },
        { label: "↩️ Refunded",   value: "refunded"  },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "fulfillmentStatus",
      type: "select",
      required: true,
      defaultValue: "new",
      options: [
        { label: "🆕 New",            value: "new"          },
        { label: "✅ Confirmed",      value: "confirmed"    },
        { label: "🔨 In Production",  value: "in_production"},
        { label: "📦 Ready to Ship",  value: "ready"        },
        { label: "🚚 Dispatched",     value: "dispatched"   },
        { label: "🎉 Delivered",      value: "delivered"    },
        { label: "❌ Cancelled",      value: "cancelled"    },
      ],
      admin: { position: "sidebar" },
    },

    // ── Customer details ───────────────────────────────────────────────
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
          name: "customerPhone",
          type: "text",
          required: true,
          label: "Phone",
          admin: { width: "30%" },
        },
        {
          name: "customerEmail",
          type: "email",
          required: true,
          label: "Email",
          admin: { width: "30%" },
        },
      ],
    },

    // ── Shipping address ───────────────────────────────────────────────
    {
      name: "shippingAddress",
      type: "group",
      label: "Shipping Address",
      fields: [
        { name: "line1",   type: "text", label: "Address Line 1", required: true },
        { name: "line2",   type: "text", label: "Address Line 2" },
        {
          type: "row",
          fields: [
            { name: "city",    type: "text", required: true, admin: { width: "34%" } },
            { name: "state",   type: "text", required: true, admin: { width: "33%" } },
            { name: "pincode", type: "text", required: true, admin: { width: "33%" } },
          ],
        },
      ],
    },

    // ── Order items ────────────────────────────────────────────────────
    {
      name: "items",
      type: "array",
      label: "Order Items",
      required: true,
      admin: {
        description: "Products exactly as configured at the time of purchase.",
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "productCode",  type: "text", label: "Code",    required: true, admin: { width: "20%" } },
            { name: "displayName",  type: "text", label: "Product", required: true, admin: { width: "40%" } },
            { name: "qty",          type: "number", defaultValue: 1, admin: { width: "10%" } },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "metal",       type: "text", label: "Metal",    admin: { width: "15%" } },
            { name: "goldColor",   type: "text", label: "Colour",   admin: { width: "15%" } },
            { name: "diamondTier", type: "text", label: "Diamond",  admin: { width: "20%" } },
            { name: "ringSize",    type: "text", label: "Ring Size", admin: { width: "15%" } },
            { name: "caratWeight", type: "text", label: "Carat",    admin: { width: "15%" } },
            { name: "unitPriceInr", type: "number", label: "Unit ₹", admin: { width: "20%" } },
          ],
        },
        {
          name: "engraving",
          type: "text",
          label: "Engraving / Special Instructions",
        },
      ],
    },

    // ── Totals ─────────────────────────────────────────────────────────
    {
      type: "row",
      fields: [
        {
          name: "subtotalInr",
          type: "number",
          label: "Subtotal (₹)",
          admin: { width: "34%", readOnly: true },
        },
        {
          name: "gstInr",
          type: "number",
          label: "GST 3% (₹)",
          admin: { width: "33%", readOnly: true },
        },
        {
          name: "totalInr",
          type: "number",
          label: "Total (₹)",
          required: true,
          admin: { width: "33%", readOnly: true },
        },
      ],
    },

    // ── Additional info ────────────────────────────────────────────────
    {
      name: "orderNotes",
      type: "textarea",
      label: "Order Notes (from customer)",
      admin: { rows: 2 },
    },
    {
      name: "gstInvoiceRequested",
      type: "checkbox",
      label: "GST Invoice Requested",
      admin: { position: "sidebar" },
    },
    {
      name: "trackingInfo",
      type: "text",
      label: "Tracking Number / AWB",
      admin: {
        position: "sidebar",
        description: "Enter after dispatching to share with customer.",
      },
    },
    {
      name: "adminNotes",
      type: "textarea",
      label: "Admin Notes (internal)",
      admin: { rows: 3, description: "Not visible to the customer." },
    },
  ],
};
