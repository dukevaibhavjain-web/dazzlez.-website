import type { CollectionConfig } from "payload";

/**
 * Making charge rules — one row per metal type.
 *
 *   - Gold rule applies to all gold purities (9K / 14K / 18K / 22K)
 *   - Silver 925 has its own rule
 *   - Platinum has its own rule
 *
 * Pricing engine looks up by metal type (derived from product's purity choice).
 *
 * Two modes:
 *   - wastage_plus_making: (metal_weight × wastage% × gold_rate) + (metal_weight × making_per_g)
 *   - flat:                metal_weight × making_per_g
 *
 * Both respect minMaking as a floor.
 */
export const MakingRules: CollectionConfig = {
  slug: "making-rules",
  labels: { singular: "Making Rule", plural: "Making Rules" },
  admin: {
    useAsTitle: "metalType",
    defaultColumns: ["metalType", "type", "wastagePct", "makingPerG", "minMaking"],
    group: "Pricing",
    description:
      "Making charges per metal type. Edit anytime — affects every product using that metal immediately.",
  },
  access: { read: () => true },
  fields: [
    {
      name: "metalType",
      type: "select",
      required: true,
      unique: true,
      index: true,
      options: [
        { label: "Gold (any purity — 9K/14K/18K/22K)", value: "gold" },
        { label: "Silver 925", value: "silver" },
        { label: "Platinum", value: "platinum" },
      ],
    },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "wastage_plus_making",
      options: [
        { label: "Wastage % + Making per gram", value: "wastage_plus_making" },
        { label: "Flat Making per gram", value: "flat" },
      ],
    },
    {
      name: "wastagePct",
      type: "number",
      defaultValue: 0,
      admin: { description: "Wastage % (only for Wastage+Making mode)" },
    },
    {
      name: "makingPerG",
      type: "number",
      required: true,
      admin: { description: "INR per gram of metal" },
    },
    {
      name: "minMaking",
      type: "number",
      defaultValue: 0,
      admin: { description: "Minimum making charge (floor)" },
    },
  ],
};
