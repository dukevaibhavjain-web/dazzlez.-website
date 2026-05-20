import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Categories } from "./collections/Categories";
import { ColorStones } from "./collections/ColorStones";
import { Customers } from "./collections/Customers";
import { DiamondCategories } from "./collections/DiamondCategories";
import { FxRates } from "./collections/FxRates";
import { MakingRules } from "./collections/MakingRules";
import { Occasions } from "./collections/Occasions";
import { Products } from "./collections/Products";
import { RateDiamond } from "./collections/RateDiamond";
import { RateGold } from "./collections/RateGold";
import { Shapes } from "./collections/Shapes";
import { SubCategories } from "./collections/SubCategories";
import { FeatureFlags } from "./globals/FeatureFlags";
import { SiteSettings } from "./globals/SiteSettings";
import { consoleEmailAdapter } from "./lib/email-console";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  admin: {
    user: "users",
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: "users",
      auth: true,
      admin: { useAsTitle: "email", group: "Admin" },
      fields: [],
    },
    {
      slug: "media",
      upload: true,
      admin: { group: "Catalog" },
      fields: [{ name: "alt", type: "text" }],
    },
    // Catalog
    Categories,
    SubCategories,
    Shapes,
    Occasions,
    Products,
    // Pricing
    DiamondCategories,
    ColorStones,
    RateGold,
    RateDiamond,
    MakingRules,
    FxRates,
    // CRM
    Customers,
  ],
  globals: [SiteSettings, FeatureFlags],
  editor: lexicalEditor(),
  email: consoleEmailAdapter,
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  sharp,
});
