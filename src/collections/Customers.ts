import type { CollectionConfig } from "payload";

/**
 * Customers — storefront-facing users (separate from `users` which is the
 * admin login).
 *
 * Auth is enabled with email as the primary identifier. In Phase 0 we keep
 * the default email+password flow so Payload's machinery (sessions, cookies,
 * password reset) just works. In Phase 1B we'll layer a magic-link flow on top
 * that auto-generates a random password the customer never sees.
 */
export const Customers: CollectionConfig = {
  slug: "customers",
  labels: { singular: "Customer", plural: "Customers" },
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "fullName", "phone", "createdAt"],
    group: "CRM",
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: "fullName", type: "text" },
    {
      name: "phone",
      type: "text",
      index: true,
      admin: { description: "WhatsApp number is the universal customer key. Include country code." },
    },
    { name: "waOptIn", type: "checkbox", label: "WhatsApp opt-in", defaultValue: false },
    {
      name: "segments",
      type: "select",
      hasMany: true,
      options: [
        { label: "New", value: "new" },
        { label: "Engaged", value: "engaged" },
        { label: "High-value", value: "high_value" },
        { label: "VIP", value: "vip" },
        { label: "Dormant", value: "dormant" },
      ],
    },
    { name: "source", type: "text", admin: { description: "Where this customer entered: 'web', 'wa', 'referral', etc." } },
  ],
};
