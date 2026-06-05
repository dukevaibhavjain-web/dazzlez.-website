/**
 * POST /api/admin/import-products/run
 *
 * Phase 2 — Execute: receives the selected ParsedProduct list from the browser
 * (already parsed + DB-checked in the /preview step), upserts each product,
 * and returns per-product results.
 *
 * Body: { products: ParsedProduct[] }   (only the selected subset)
 *
 * Used by: BulkImportPage.tsx (Step 3 — Import)
 */

import { getPayload } from "payload";
import config from "@payload-config";
import type { ParsedProduct } from "../route";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json() as { products?: ParsedProduct[] };
    const products = body.products;
    if (!Array.isArray(products) || products.length === 0) {
      return Response.json({ error: "No products provided." }, { status: 400 });
    }

    const payload = await getPayload({ config });

    const results: Array<{
      code: string;
      action: "created" | "updated" | "skipped" | "error";
      error?: string;
    }> = [];

    for (const p of products) {
      try {
        // Skip products whose category wasn't found in the DB
        if (!p.categoryId) {
          results.push({ code: p.code, action: "skipped", error: `Category '${p.categorySlug}' not found in DB` });
          continue;
        }

        const slug = `${slugify(p.displayName)}-${slugify(p.code)}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = {
          code: p.code,
          slug,
          displayName: p.displayName,
          description: p.description ?? "",
          category: p.categoryId,
          primaryShape: p.shapeId ?? null,
          isSolitaire: p.isSolitaire,
          isRing: p.isRing,
          fulfillmentType: "made_to_order",
          status: "draft",
          metals: p.metals,
          diamonds: p.diamonds.map((d) => ({
            role: d.role,
            shape: p.shapeId ?? null,
            sizeMm: d.sizeMm,
            weightCt: d.weightCt,
            count: d.count,
          })),
          colorStones: [],
          remarks: p.remarks,
        };

        if (p.dbStatus === "existing" && p.dbId != null) {
          await payload.update({ collection: "products", id: p.dbId, data });
          results.push({ code: p.code, action: "updated" });
        } else {
          await payload.create({ collection: "products", data });
          results.push({ code: p.code, action: "created" });
        }
      } catch (err) {
        results.push({
          code: p.code,
          action: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const summary = {
      created: results.filter((r) => r.action === "created").length,
      updated: results.filter((r) => r.action === "updated").length,
      skipped: results.filter((r) => r.action === "skipped").length,
      errors:  results.filter((r) => r.action === "error").length,
    };

    return Response.json({ results, summary });
  } catch (err) {
    console.error("[import-products/run]", err);
    return Response.json({ error: err instanceof Error ? err.message : "Import failed" }, { status: 500 });
  }
}

function slugify(s: string) {
  return s.normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
