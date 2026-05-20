import type { CollectionConfig } from "payload";

/**
 * Gold rate per purity. The most recent row per purity wins.
 * IBJA scraper (post-launch flag) will append new rows daily; manual override
 * is supported by just creating another row with source='manual'.
 */
export const RateGold: CollectionConfig = {
  slug: "rate-gold",
  labels: { singular: "Gold Rate", plural: "Gold Rates" },
  admin: {
    useAsTitle: "purity",
    defaultColumns: ["purity", "ratePerG", "source", "effectiveAt"],
    group: "Pricing",
    description:
      "Per-gram INR rate per purity. Pricing engine uses the most recent row for each purity.",
  },
  access: { read: () => true },
  fields: [
    {
      name: "purity",
      type: "select",
      required: true,
      index: true,
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
      name: "ratePerG",
      type: "number",
      required: true,
      admin: { description: "INR per gram." },
    },
    {
      name: "source",
      type: "select",
      defaultValue: "manual",
      options: [
        { label: "Manual (admin set)", value: "manual" },
        { label: "IBJA scrape", value: "ibja" },
        { label: "Imported", value: "imported" },
      ],
    },
    {
      name: "effectiveAt",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: { date: { pickerAppearance: "dayAndTime" } },
    },
    { name: "notes", type: "text" },
  ],
};
