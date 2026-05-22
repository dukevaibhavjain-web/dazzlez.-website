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
import { Reviews } from "./collections/Reviews";
import { FAQs } from "./collections/FAQs";
import { TrustBadges } from "./collections/TrustBadges";
import { TryAtHomeLeads } from "./collections/TryAtHomeLeads";
import { RateDiamond } from "./collections/RateDiamond";
import { RateGold } from "./collections/RateGold";
import { Shapes } from "./collections/Shapes";
import { SubCategories } from "./collections/SubCategories";
import { FeatureFlags } from "./globals/FeatureFlags";
import { SiteSettings } from "./globals/SiteSettings";
import { TryAtHomeSettings } from "./globals/TryAtHomeSettings";
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
      upload: {
        imageSizes: [
          { name: "thumb", width: 160, height: 160, position: "centre" },
          { name: "card", width: 400, height: 400, position: "centre" },
          { name: "zoom", width: 1200, height: 1200, withoutEnlargement: true },
          { name: "og", width: 1200, height: 630, position: "centre" },
        ],
        mimeTypes: ["image/jpeg", "image/png", "image/webp"],
      },
      access: {
        // Public read so storefront + admin thumbnails can fetch images.
        // Mutations stay admin-only (default).
        read: () => true,
      },
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
    // Reviews
    Reviews,
    // Site configuration
    FAQs,
    TrustBadges,
    // CRM
    Customers,
    TryAtHomeLeads,
  ],
  globals: [SiteSettings, FeatureFlags, TryAtHomeSettings],
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
