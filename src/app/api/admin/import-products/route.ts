/**
 * POST /api/admin/import-products
 *
 * Phase 1 — Preview: accepts a multipart/form-data Excel (.xlsx) file,
 * parses every product sheet using the same logic as scripts/import-excel.ts,
 * checks each product code against the DB, and returns a JSON preview list
 * with status (new / existing) and a human-readable diff for existing products.
 *
 * The response is sent back to the browser so the admin can review before
 * committing. No DB writes happen in this route.
 *
 * Used by: BulkImportPage.tsx (Step 1 → Step 2)
 */

import { getPayload } from "payload";
import config from "@payload-config";
import * as xlsx from "xlsx";

export const dynamic = "force-dynamic";

// ─── Types (shared with BulkImportPage via JSON) ─────────────────────────────

export type ParsedMetal = { purity: "9K" | "14K" | "18K" | "22K"; weightG: number };
export type ParsedDiamond = {
  role: "small" | "solitaire";
  sizeMm: string | null;
  weightCt: number;
  count: number;
};
export type DiffItem = { field: string; oldVal: string; newVal: string };

export type ParsedProduct = {
  code: string;
  categorySlug: string;
  categoryId: string | number | null;
  shapeSlug: string | null;
  shapeId: string | number | null;
  displayName: string;
  description: string | null;
  remarks: string | null;
  metals: ParsedMetal[];
  diamonds: ParsedDiamond[];
  isSolitaire: boolean;
  isRing: boolean;
  // Set by preview endpoint after DB check
  dbStatus: "new" | "existing";
  dbId: string | number | null;
  diff: DiffItem[];
};

// ─── Shape normalisation (mirrors import-excel.ts) ───────────────────────────

const SHAPE_MAP: Record<string, string> = {
  round: "round", rd: "round",
  oval: "oval", ov: "oval",
  princess: "princess", pr: "princess",
  pear: "pear", pe: "pear",
  heart: "heart", ht: "heart",
  cushion: "cushion", cu: "cushion",
  emerald: "emerald", em: "emerald",
  marquise: "marquise", mq: "marquise",
  baguette: "baguette", bg: "baguette",
  bagueette: "baguette",
  radiant: "radiant",
  asscher: "asscher",
  straight: "baguette",
};

function mapShape(raw: unknown): string | null {
  if (!raw) return null;
  const words = String(raw).trim().toLowerCase().split(/\s+/);
  for (const w of words) { if (SHAPE_MAP[w]) return SHAPE_MAP[w]; }
  return null;
}

function numOr0(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return isFinite(n) ? n : 0;
}

function strOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

type SheetType = "all-small" | "mixed";
const G9_FROM_G14_RATIO = 0.83;

function detectSheetConfig(name: string): { type: SheetType; categorySlug: string } | null {
  const n = name.toLowerCase();
  if (n.includes("earring"))  return { type: "all-small", categorySlug: "earrings" };
  if (n.includes("bracelet")) return { type: "all-small", categorySlug: "bracelets" };
  if (n.includes("necklace")) return { type: "mixed",     categorySlug: "necklaces" };
  if (n.includes("pendant"))  return { type: "mixed",     categorySlug: "pendants" };
  if (n.includes("ring"))     return { type: "mixed",     categorySlug: "rings" };
  if (n.includes("band"))     return { type: "mixed",     categorySlug: "bands" };
  return null;
}

function slugify(s: string) {
  return s.normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Excel parsing ────────────────────────────────────────────────────────────

function parseWorkbook(wb: xlsx.WorkBook): Omit<ParsedProduct, "categoryId" | "shapeId" | "dbStatus" | "dbId" | "diff">[] {
  type RawRow = Record<string, unknown>;
  const all: Omit<ParsedProduct, "categoryId" | "shapeId" | "dbStatus" | "dbId" | "diff">[] = [];

  for (const sheetName of wb.SheetNames) {
    const sheetCfg = detectSheetConfig(sheetName);
    if (!sheetCfg) continue;

    const rows = xlsx.utils.sheet_to_json<RawRow>(wb.Sheets[sheetName], { defval: null });
    type DesignRow = {
      code: string; categorySlug: string; shapeSlug: string | null;
      displayName: string; description: string | null; remarks: string | null;
      metals: ParsedMetal[]; diamonds: ParsedDiamond[]; isSolitaire: boolean;
    };
    const designs = new Map<string, DesignRow>();
    let currentCode: string | null = null;

    for (const row of rows) {
      const code = strOrNull(row["STYLE CODE"]);
      if (code) {
        currentCode = code;
        if (!designs.has(code)) {
          const g14 = numOr0(row["GOLD WEIGHT 14K"]);
          let g9 = numOr0(row["GOLD WEIGHT 9K"]);
          if (g9 === 0 && g14 > 0) g9 = +(g14 * G9_FROM_G14_RATIO).toFixed(3);
          const metals = ([
            { purity: "9K"  as const, weightG: g9 },
            { purity: "14K" as const, weightG: g14 },
            { purity: "18K" as const, weightG: numOr0(row["GOLD WEIGHT 18K"]) },
            { purity: "22K" as const, weightG: numOr0(row["GOLD WEIGHT 22K"]) },
          ] as ParsedMetal[]).filter((m) => m.weightG > 0);

          const rawName = strOrNull(row["PRODUCT NAME"]);
          const shapeSlug = mapShape(row["DIAMOND SHAPE"]);
          const isSolitaire = false; // set below
          const category = sheetCfg.categorySlug;
          const shape = shapeSlug ? shapeSlug[0].toUpperCase() + shapeSlug.slice(1) + " " : "";
          const catLabel = category[0].toUpperCase() + category.slice(1).replace(/s$/, "");
          const placeholderName = `${shape}${catLabel} — ${code}`;

          designs.set(code, {
            code,
            categorySlug: category,
            shapeSlug,
            displayName: rawName || placeholderName,
            description: strOrNull(row["PRODUCT DESCRIPTION"]),
            remarks: strOrNull(row["Remarks"]),
            metals,
            diamonds: [],
            isSolitaire,
          });
        }
      }
      if (!currentCode) continue;
      const design = designs.get(currentCode)!;

      if (sheetCfg.type === "all-small") {
        const ct = numOr0(row["DIAMOND WEIGHT"]);
        const num = numOr0(row["NUMBER OF DIAMOND"]);
        const sizeMm = strOrNull(row["DIAMOND SIZE"]);
        if (ct > 0 && num > 0) design.diamonds.push({ role: "small", sizeMm, weightCt: ct, count: Math.round(num) });
      } else {
        const smallCt  = numOr0(row["Small Ct"]);
        const smallNum = numOr0(row["Small - Num"]);
        const solCt    = numOr0(row["Solitaire Ct"]);
        const solNum   = numOr0(row["Solitaire - Num"]);
        const sizeMm   = strOrNull(row["DIAMOND SIZE"]);
        if (smallCt === 0 && smallNum === 0 && solCt === 0 && solNum === 0) {
          const ct = numOr0(row["DIAMOND WEIGHT"]);
          const num = numOr0(row["NUMBER OF DIAMOND"]);
          if (ct > 0 && num > 0) design.diamonds.push({ role: "small", sizeMm, weightCt: ct, count: Math.round(num) });
        } else {
          if (smallCt > 0 && smallNum > 0) design.diamonds.push({ role: "small", sizeMm, weightCt: smallCt, count: Math.round(smallNum) });
          if (solCt > 0 && solNum > 0) {
            design.diamonds.push({ role: "solitaire", sizeMm, weightCt: solCt, count: Math.round(solNum) });
            design.isSolitaire = true;
          }
        }
      }
    }

    for (const d of designs.values()) {
      if (d.metals.length === 0) continue;
      all.push({
        code: d.code,
        categorySlug: d.categorySlug,
        shapeSlug: d.shapeSlug,
        displayName: d.displayName,
        description: d.description,
        remarks: d.remarks,
        metals: d.metals,
        diamonds: d.diamonds,
        isSolitaire: d.isSolitaire,
        isRing: d.categorySlug === "rings",
      });
    }
  }
  return all;
}

// ─── Diff helper ──────────────────────────────────────────────────────────────

function buildDiff(parsed: ReturnType<typeof parseWorkbook>[number], existing: Record<string, unknown>): DiffItem[] {
  const diff: DiffItem[] = [];
  const exName = String(existing.displayName ?? "");
  if (exName && exName !== parsed.displayName) diff.push({ field: "Display Name", oldVal: exName, newVal: parsed.displayName });

  type ExMetal = { purity: string };
  const exMetals = ((existing.metals as ExMetal[] | undefined) ?? []).map((m) => m.purity).sort().join(", ");
  const newMetals = parsed.metals.map((m) => m.purity).sort().join(", ");
  if (exMetals !== newMetals) diff.push({ field: "Metals", oldVal: exMetals || "—", newVal: newMetals || "—" });

  type ExDiamond = { weightCt?: number };
  const exDiaTotal = ((existing.diamonds as ExDiamond[] | undefined) ?? []).reduce((s, d) => s + (d.weightCt ?? 0), 0).toFixed(2);
  const newDiaTotal = parsed.diamonds.reduce((s, d) => s + d.weightCt, 0).toFixed(2);
  if (exDiaTotal !== newDiaTotal) diff.push({ field: "Diamond Total (ct)", oldVal: exDiaTotal, newVal: newDiaTotal });

  const exSol = !!(existing.isSolitaire);
  if (exSol !== parsed.isSolitaire) diff.push({ field: "Solitaire", oldVal: String(exSol), newVal: String(parsed.isSolitaire) });

  return diff;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return Response.json({ error: "Only .xlsx / .xls files are accepted." }, { status: 415 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = xlsx.read(buffer, { type: "buffer" });
    const parsed = parseWorkbook(wb);

    if (parsed.length === 0) {
      return Response.json({ error: "No products found. Check that sheet names include: rings, earrings, necklaces, bracelets, pendants, bands." }, { status: 422 });
    }

    // Resolve taxonomy lookups
    const payload = await getPayload({ config });
    const [catRes, shapeRes] = await Promise.all([
      payload.find({ collection: "categories", limit: 100 }),
      payload.find({ collection: "shapes",     limit: 100 }),
    ]);
    const catBySlug   = new Map(catRes.docs.map((c)   => [(c as { slug: string }).slug, c.id]));
    const shapeBySlug = new Map(shapeRes.docs.map((s) => [(s as { slug: string }).slug, s.id]));

    // Bulk-check which codes already exist
    const allCodes = parsed.map((p) => p.code);
    const existingRes = await payload.find({
      collection: "products",
      where: { code: { in: allCodes } },
      depth: 0,
      limit: allCodes.length,
    });
    const existingByCode = new Map(
      existingRes.docs.map((d) => [(d as { code: string }).code, d]),
    );

    // Build preview list
    const products: ParsedProduct[] = parsed.map((p) => {
      const catId   = catBySlug.get(p.categorySlug) ?? null;
      const shapeId = p.shapeSlug ? (shapeBySlug.get(p.shapeSlug) ?? null) : null;
      const existing = existingByCode.get(p.code);
      const dbStatus = existing ? "existing" : "new";
      const dbId     = existing ? existing.id : null;
      const diff     = existing ? buildDiff(p, existing as Record<string, unknown>) : [];
      return { ...p, categoryId: catId, shapeId, dbStatus, dbId, diff };
    });

    return Response.json({ products, totalParsed: parsed.length });
  } catch (err) {
    console.error("[import-products]", err);
    return Response.json({ error: err instanceof Error ? err.message : "Parse failed" }, { status: 500 });
  }
}
