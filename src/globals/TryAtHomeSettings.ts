import type { GlobalConfig } from "payload";

/**
 * Try at Home Settings — controls the lead-gen card shown on every PDP.
 * Toggle on/off, customise copy, and upload an image — all from admin.
 */
export const TryAtHomeSettings: GlobalConfig = {
  slug: "try-at-home-settings",
  label: "Try at Home",
  admin: {
    group: "Site",
    description:
      "Controls the 'Try at Home' lead-generation card shown on product pages. Leads are saved under CRM → Try at Home Leads.",
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "enabled",
      type: "checkbox",
      label: "Show Try at Home card on all product pages",
      defaultValue: false,
    },
    {
      name: "title",
      type: "text",
      defaultValue: "Try at Home",
      admin: {
        description: "Heading shown on the card",
      },
    },
    {
      name: "description",
      type: "textarea",
      defaultValue:
        "Try your selected pieces from the comfort of your home. Our representative visits you — no payment until you decide.",
      admin: {
        rows: 3,
        description: "Body text shown below the heading",
      },
    },
    {
      name: "buttonText",
      type: "text",
      defaultValue: "Request a Home Trial",
      admin: {
        description: "CTA button label",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Optional lifestyle image shown on the left of the card (landscape works best)",
      },
    },
    {
      name: "disclaimer",
      type: "text",
      admin: {
        description: "Optional small-print shown below the form (e.g. 'Available in Jaipur & Delhi only')",
      },
    },
  ],
};
