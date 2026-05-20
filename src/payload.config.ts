import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Categories } from "./collections/Categories";
import { Customers } from "./collections/Customers";
import { Occasions } from "./collections/Occasions";
import { Shapes } from "./collections/Shapes";
import { SubCategories } from "./collections/SubCategories";
import { FeatureFlags } from "./globals/FeatureFlags";
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
    Categories,
    SubCategories,
    Shapes,
    Occasions,
    Customers,
  ],
  globals: [FeatureFlags],
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
