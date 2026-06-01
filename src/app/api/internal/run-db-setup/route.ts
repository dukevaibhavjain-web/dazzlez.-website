/**
 * GET /api/internal/run-db-setup?secret=dazzlez-setup-2026
 *
 * ONE-TIME endpoint — adds the hero colour columns to the products table
 * and records the migration so Payload doesn't try to re-run it.
 *
 * THIS FILE WILL BE DELETED after the setup is confirmed.
 */
import { getPayload } from "payload";
import config from "@payload-config";
import { sql } from "@payloadcms/db-postgres";

export const dynamic = "force-dynamic";

const SECRET = "dazzlez-setup-2026";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  try {
    const payload = await getPayload({ config });
    // Access the underlying drizzle db from Payload's postgres adapter
    const db = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }).drizzle;

    const run = async (label: string, query: string) => {
      try {
        await db.execute(sql.raw(query));
        results.push(`✅ ${label}`);
      } catch (err) {
        const msg = (err as Error).message ?? String(err);
        // Ignore "already exists" errors — idempotent
        if (msg.includes("already exists") || msg.includes("duplicate column")) {
          results.push(`⏭️  ${label} (already exists)`);
        } else {
          results.push(`❌ ${label}: ${msg}`);
          throw err;
        }
      }
    };

    await run(
      "ADD hero_image_yellow_id",
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hero_image_yellow_id" integer`,
    );
    await run(
      "ADD hero_image_white_id",
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hero_image_white_id" integer`,
    );
    await run(
      "ADD hero_image_rose_id",
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hero_image_rose_id" integer`,
    );
    await run(
      "FK yellow",
      `ALTER TABLE "products" ADD CONSTRAINT "products_hero_image_yellow_id_media_id_fk" FOREIGN KEY ("hero_image_yellow_id") REFERENCES "media"("id") ON DELETE SET NULL`,
    );
    await run(
      "FK white",
      `ALTER TABLE "products" ADD CONSTRAINT "products_hero_image_white_id_media_id_fk" FOREIGN KEY ("hero_image_white_id") REFERENCES "media"("id") ON DELETE SET NULL`,
    );
    await run(
      "FK rose",
      `ALTER TABLE "products" ADD CONSTRAINT "products_hero_image_rose_id_media_id_fk" FOREIGN KEY ("hero_image_rose_id") REFERENCES "media"("id") ON DELETE SET NULL`,
    );
    await run(
      "Record migration",
      `INSERT INTO payload_migrations (name, batch, "updatedAt", "createdAt") VALUES ('20260601_103639', 1, now(), now()) ON CONFLICT DO NOTHING`,
    );

    return Response.json({ ok: true, results });
  } catch (err) {
    return Response.json({ ok: false, results, error: (err as Error).message }, { status: 500 });
  }
}
