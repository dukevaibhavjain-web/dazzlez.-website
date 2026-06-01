/**
 * run-migration-direct.ts
 *
 * Runs the pending Payload migration (20260601_103639) directly via `pg`,
 * bypassing the Payload CLI which times out on Neon cold-start.
 *
 * Also inserts the migration record into payload_migrations so Payload's
 * own migrate command considers it applied.
 *
 * Usage:  tsx --env-file=.env.local scripts/run-migration-direct.ts
 */

import { createRequire } from "module";
const _require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { Client } = _require("pg") as typeof import("pg");

const MIGRATION_NAME = "20260601_103639";

async function connectWithRetry(connectionString: string, retries = 5): Promise<Client> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 30000,
      query_timeout: 120000,
    });
    try {
      console.log(`🔌 Connecting to Neon (attempt ${attempt}/${retries})…`);
      await client.connect();
      console.log("✅ Connected.");
      return client;
    } catch (err) {
      await client.end().catch(() => {});
      if (attempt === retries) throw err;
      console.log(`   Retrying in 3 s… (${(err as Error).message})`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error("unreachable");
}

async function main() {
  const uri = process.env.DATABASE_URI;
  if (!uri) throw new Error("DATABASE_URI not set — run with --env-file=.env.local");

  // ── 1. Check if migration already applied ────────────────────────────────
  const check = await connectWithRetry(uri);
  let alreadyApplied = false;
  try {
    const { rows } = await check.query(
      `SELECT 1 FROM payload_migrations WHERE name = $1 LIMIT 1`,
      [MIGRATION_NAME],
    );
    alreadyApplied = rows.length > 0;
  } catch {
    // payload_migrations might not exist yet — that's fine
  }
  await check.end();

  if (alreadyApplied) {
    console.log(`ℹ️  Migration ${MIGRATION_NAME} is already recorded as applied. Checking columns…`);
    // Still verify the columns exist
  }

  // ── 2. Apply DDL ──────────────────────────────────────────────────────────
  const client = await connectWithRetry(uri);
  try {
    await client.query("BEGIN");

    console.log("🔨 Adding hero colour columns to products…");
    await client.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hero_image_yellow_id" integer`);
    await client.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hero_image_white_id"  integer`);
    await client.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hero_image_rose_id"   integer`);

    console.log("🔨 Adding FK constraints (skip if exists)…");
    for (const [col, name] of [
      ["hero_image_yellow_id", "products_hero_image_yellow_id_media_id_fk"],
      ["hero_image_white_id",  "products_hero_image_white_id_media_id_fk"],
      ["hero_image_rose_id",   "products_hero_image_rose_id_media_id_fk"],
    ] as const) {
      try {
        await client.query(
          `ALTER TABLE "products" ADD CONSTRAINT "${name}" FOREIGN KEY ("${col}") REFERENCES "public"."media"("id") ON DELETE set null`,
        );
      } catch (e) {
        if ((e as { code?: string }).code === "42710") {
          // constraint already exists — fine
        } else {
          throw e;
        }
      }
    }

    console.log("🔨 Adding indexes…");
    await client.query(`CREATE INDEX IF NOT EXISTS "products_hero_image_yellow_idx" ON "products" ("hero_image_yellow_id")`);
    await client.query(`CREATE INDEX IF NOT EXISTS "products_hero_image_white_idx"  ON "products" ("hero_image_white_id")`);
    await client.query(`CREATE INDEX IF NOT EXISTS "products_hero_image_rose_idx"   ON "products" ("hero_image_rose_id")`);

    // ── Record migration as applied ─────────────────────────────────────────
    if (!alreadyApplied) {
      console.log("📝 Recording migration in payload_migrations…");
      await client.query(
        `INSERT INTO payload_migrations (name, batch, "updatedAt", "createdAt")
         VALUES ($1, 1, now(), now())
         ON CONFLICT DO NOTHING`,
        [MIGRATION_NAME],
      );
    }

    await client.query("COMMIT");
    console.log("\n✅ Migration applied successfully!");
    console.log("   Products table now has: hero_image_yellow_id, hero_image_white_id, hero_image_rose_id");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
