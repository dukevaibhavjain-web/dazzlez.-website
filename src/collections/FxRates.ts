import type { CollectionConfig } from "payload";

/**
 * Foreign exchange rates — INR per 1 unit of currency.
 * Used for multi-currency display only; internal pricing is always INR.
 */
export const FxRates: CollectionConfig = {
  slug: "fx-rates",
  labels: { singular: "FX Rate", plural: "FX Rates" },
  admin: {
    useAsTitle: "currency",
    defaultColumns: ["currency", "inrPerUnit", "source", "effectiveAt"],
    group: "Pricing",
    description: "How many INR for 1 unit of each foreign currency. Edit anytime.",
  },
  access: { read: () => true },
  fields: [
    {
      name: "currency",
      type: "select",
      required: true,
      index: true,
      options: [
        { label: "USD ($)", value: "USD" },
        { label: "AED (د.إ)", value: "AED" },
        { label: "GBP (£)", value: "GBP" },
        { label: "EUR (€)", value: "EUR" },
        { label: "SGD (S$)", value: "SGD" },
      ],
    },
    {
      name: "inrPerUnit",
      type: "number",
      required: true,
      admin: { description: "₹ per 1 unit of this currency, e.g. 85 for USD" },
    },
    {
      name: "source",
      type: "select",
      defaultValue: "manual",
      options: [
        { label: "Manual", value: "manual" },
        { label: "API", value: "api" },
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
