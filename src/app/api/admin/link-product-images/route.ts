/**
 * POST /api/admin/link-product-images
 *
 * After the browser has uploaded all images for one product via
 * /api/admin/upload, it calls this endpoint to assign them to the product.
 *
 * Body: {
 *   code: string              — product code / SKU, e.g. "RR-001"
 *   mediaIds: (string|number)[]  — ordered list of media IDs (hero first)
 * }
 *
 * Sets:
 *   heroImage       = mediaIds[0]
 *   gallery         = mediaIds.slice(1) with goldColor: ""
 *   defaultGoldColor = "yellow" if the product has gold metals, else "white"
 *
 * Idempotent — calling it again replaces the previous gallery.
 *
 * Used by: BulkImportPage.tsx (image-link step inside the import loop)
 */

import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json() as { code?: string; mediaIds?: (string | number)[] };

    if (!body.code || !Array.isArray(body.mediaIds) || body.mediaIds.length === 0) {
      return Response.json({ error: "code and mediaIds are required." }, { status: 400 });
    }

    const payload = await getPayload({ config });

    const found = await payload.find({
      collection: "products",
      where: { code: { equals: body.code.toUpperCase() } },
      depth: 0,
      limit: 1,
    });

    if (found.totalDocs === 0) {
      return Response.json({ error: `Product '${body.code}' not found.` }, { status: 404 });
    }

    const product = found.docs[0];

    // Determine default gold colour from metals (mirrors import-images.ts)
    type ProductWithMetals = { metals?: Array<{ purity: string }> };
    const metals = (product as unknown as ProductWithMetals).metals ?? [];
    const hasGold = metals.some((m) => /^\d+K$/i.test(m.purity));
    const defaultGoldColor = hasGold ? "yellow" : "white";

    await payload.update({
      collection: "products",
      id: product.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        heroImage:        body.mediaIds[0] as number,
        defaultGoldColor,
        gallery: body.mediaIds.slice(1).map((id) => ({
          image: id as number,
          goldColor: "" as const,
        })),
      } as any,
    });

    return Response.json({ ok: true, code: body.code, imageCount: body.mediaIds.length });
  } catch (err) {
    console.error("[link-product-images]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Link failed" },
      { status: 500 },
    );
  }
}
