import type { CollectionConfig } from "payload";

/**
 * Diamond rate matrix.
 *
 * Lookup at price-compute time: diamond_category × carat band → INR/ct.
 * Optional 4Cs (cut/color/clarity) can be added for finer-grained pricing
 * (leave blank for "any" / catch-all band).
 *
 * Pricing band convention:
 *   ctBandMin (inclusive) <= weight < ctBandMax (exclusive)
 *
 * The whole stone is priced at the band's rate (jewelry industry standard —
 * a 1.5ct stone at the 1–2ct band rate, not split across bands).
 */
export const RateDiamond: CollectionConfig = {
  slug: "rate-diamond",
  labels: { singular: "Diamond Rate", plural: "Diamond Rates" },
  admin: {
    defaultColumns: ["diamondCategory", "ctBandMin", "ctBandMax", "ratePerCt", "cut", "color", "clarity"],
    group: "Pricing",
    description:
      "Per-carat INR rate by diamond category × carat band. Add 4Cs-specific rows for finer pricing later.",
  },
  access: { read: () => true },
  fields: [
    {
      name: "diamondCategory",
      type: "relationship",
      relationTo: "diamond-categories",
      required: true,
      index: true,
    },
    {
      type: "row",
      fields: [
        { name: "ctBandMin", type: "number", required: true, defaultValue: 0, admin: { width: "50%", description: "Inclusive lower bound, e.g. 0.00" } },
        { name: "ctBandMax", type: "number", required: true, admin: { width: "50%", description: "Exclusive upper bound, e.g. 1.00" } },
      ],
    },
    {
      name: "ratePerCt",
      type: "number",
      required: true,
      admin: { description: "INR per carat. Whole stone is multiplied by this rate." },
    },
    {
      type: "row",
      fields: [
        { name: "cut", type: "text", admin: { width: "33%", description: "Optional, e.g. 'Excellent'. Leave blank for any." } },
        { name: "color", type: "text", admin: { width: "33%", description: "Optional, e.g. 'G'. Leave blank for any." } },
        { name: "clarity", type: "text", admin: { width: "33%", description: "Optional, e.g. 'SI'. Leave blank for any." } },
      ],
    },
    {
      name: "effectiveAt",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
  ],
};
