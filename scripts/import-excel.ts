/**
 * Excel importer — reads master_2025_transparent.xlsx (or any sheet matching
 * the same column layout) and creates/updates Product documents in Payload.
 *
 * Handles two sheet shapes:
 *   - "All Small" (Earring, Bracelet): one diamond bucket per row
 *   - "Mixed" (Ring, Necklace, Pendant): separate Small + Solitaire columns
 *
 * Multi-row designs are supported: a row with an empty STYLE CODE is treated
 * as a continuation of the previous design (additional diamond entry).
 *
 * Idempotent: re-running updates existing products by code; never duplicates.
 *
 * Usage:
 *   pnpm import:excel <path-to-xlsx>
 *   pnpm import:excel  (uses default path)
 */
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { getPayload } from "payload";
import config from "../src/payload.config.js";

const DEFAULT_FILE =
  "C:/Users/Vaibhav/Downloads/master_2025_with_names.xlsx";

// If the sheet has 14K weight but no 9K weight, compute 9K = 14K × this ratio.
const G9_FROM_G14_RATIO = 0.83;

type SheetType = "all-small" | "mixed";
type SheetConfig = { type: SheetType; categorySlug: string };

type DesignRow = {
  styleCode: string;
  category: string;
  shapeSlug: string | null;
  productName: string | null;
  productDescription: string | null;
  metals: Array<{ purity: "9K" | "14K" | "18K" | "22K"; weightG: number }>;
  diamonds: Array<{
    role: "small" | "solitaire";
    sizeMm: string | null;
    weightCt: number;
    count: number;
  }>;
  isSolitaire: boolean;
  remarks: string | null;
};

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
  bagueette: "baguette", // typo in sheet
  radiant: "radiant",
  asscher: "asscher",
  straight: "baguette", // 'STRAIGHT' often means straight baguette
};

function mapShape(raw: unknown): string | null {
  if (!raw) return null;
  const words = String(raw).trim().toLowerCase().split(/\s+/);
  for (const w of words) {
    if (SHAPE_MAP[w]) return SHAPE_MAP[w];
  }
  return null;
}

function detectSheetConfig(sheetName: string): SheetConfig | null {
  const n = sheetName.toLowerCase();
  if (n.includes("earring")) return { type: "all-small", categorySlug: "earrings" };
  if (n.includes("bracelet")) return { type: "all-small", categorySlug: "bracelets" };
  if (n.includes("necklace")) return { type: "mixed", categorySlug: "necklaces" };
  if (n.includes("pendant")) return { type: "mixed", categorySlug: "pendants" };
  if (n.includes("ring")) return { type: "mixed", categorySlug: "rings" };
  if (n.includes("band")) return { type: "mixed", categorySlug: "bands" };
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

function parseSheet(sheet: xlsx.WorkSheet, sheetCfg: SheetConfig): DesignRow[] {
  type RawRow = Record<string, unknown>;
  const rows = xlsx.utils.sheet_to_json<RawRow>(sheet, { defval: null });

  const designs = new Map<string, DesignRow>();
  let currentCode: string | null = null;

  for (const row of rows) {
    const code = strOrNull(row["STYLE CODE"]);

    if (code) {
      currentCode = code;
      if (!designs.has(code)) {
        const g14 = numOr0(row["GOLD WEIGHT 14K"]);
        let g9 = numOr0(row["GOLD WEIGHT 9K"]);
        // User rule: if 9K weight isn't recorded, derive it from 14K
        if (g9 === 0 && g14 > 0) {
          g9 = +(g14 * G9_FROM_G14_RATIO).toFixed(3);
        }
        const metals = (
          [
            { purity: "9K" as const, weightG: g9 },
            { purity: "14K" as const, weightG: g14 },
            { purity: "18K" as const, weightG: numOr0(row["GOLD WEIGHT 18K"]) },
            { purity: "22K" as const, weightG: numOr0(row["GOLD WEIGHT 22K"]) },
          ]
        ).filter((m) => m.weightG > 0);

        designs.set(code, {
          styleCode: code,
          category: sheetCfg.categorySlug,
          shapeSlug: mapShape(row["DIAMOND SHAPE"]),
          productName: strOrNull(row["PRODUCT NAME"]),
          productDescription: strOrNull(row["PRODUCT DESCRIPTION"]),
          metals,
          diamonds: [],
          isSolitaire: false,
          remarks: strOrNull(row["Remarks"]),
        });
      }
    }

    if (!currentCode) continue;
    const design = designs.get(currentCode)!;

    // Diamond extraction depends on sheet type
    if (sheetCfg.type === "all-small") {
      const ct = numOr0(row["DIAMOND WEIGHT"]);
      const num = numOr0(row["NUMBER OF DIAMOND"]);
      const sizeMm = strOrNull(row["DIAMOND SIZE"]);
      if (ct > 0 && num > 0) {
        design.diamonds.push({
          role: "small",
          sizeMm,
          weightCt: ct,
          count: Math.round(num),
        });
      }
    } else {
      // mixed sheet — small + solitaire split columns
      const smallCt = numOr0(row["Small Ct"]);
      const smallNum = numOr0(row["Small - Num"]);
      const solCt = numOr0(row["Solitaire Ct"]);
      const solNum = numOr0(row["Solitaire - Num"]);
      const sizeMm = strOrNull(row["DIAMOND SIZE"]);

      // Fallback: if Small Ct columns are blank, use the legacy
      // 'DIAMOND WEIGHT' + 'NUMBER OF DIAMOND' columns for small stones.
      if (smallCt === 0 && smallNum === 0 && solCt === 0 && solNum === 0) {
        const ct = numOr0(row["DIAMOND WEIGHT"]);
        const num = numOr0(row["NUMBER OF DIAMOND"]);
        if (ct > 0 && num > 0) {
          design.diamonds.push({
            role: "small",
            sizeMm,
            weightCt: ct,
            count: Math.round(num),
          });
        }
      } else {
        if (smallCt > 0 && smallNum > 0) {
          design.diamonds.push({
            role: "small",
            sizeMm,
            weightCt: smallCt,
            count: Math.round(smallNum),
          });
        }
        if (solCt > 0 && solNum > 0) {
          design.diamonds.push({
            role: "solitaire",
            sizeMm,
            weightCt: solCt,
            count: Math.round(solNum),
          });
          design.isSolitaire = true;
        }
      }
    }
  }

  // Filter out designs that have no metals (skip rows that were just headers / footers)
  return [...designs.values()].filter((d) => d.metals.length > 0);
}

function placeholderName(d: DesignRow): string {
  const category =
    d.category[0].toUpperCase() + d.category.slice(1).replace(/s$/, ""); // "rings" → "Ring"
  const shape = d.shapeSlug
    ? d.shapeSlug[0].toUpperCase() + d.shapeSlug.slice(1) + " "
    : "";
  const solitaire = d.isSolitaire ? "Solitaire " : "";
  return `${shape}${solitaire}${category} — ${d.styleCode}`;
}

async function main() {
  const arg = process.argv[2];
  const filepath = arg ? path.resolve(arg) : DEFAULT_FILE;
  console.log(`\n📥 Reading ${filepath}\n`);

  const wb = xlsx.readFile(filepath);
  const payload = await getPayload({ config });

  // Pre-load taxonomy lookups
  const categoryDocs = await payload.find({ collection: "categories", limit: 100 });
  const categoryBySlug = new Map<string, string | number>();
  for (const c of categoryDocs.docs) {
    categoryBySlug.set((c as { slug: string }).slug, c.id);
  }
  const shapeDocs = await payload.find({ collection: "shapes", limit: 100 });
  const shapeBySlug = new Map<string, string | number>();
  for (const s of shapeDocs.docs) {
    shapeBySlug.set((s as { slug: string }).slug, s.id);
  }

  let totalParsed = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const sheetName of wb.SheetNames) {
    const sheetCfg = detectSheetConfig(sheetName);
    if (!sheetCfg) {
      console.log(`⏭  Skipping sheet "${sheetName}" — no category match`);
      continue;
    }
    const designs = parseSheet(wb.Sheets[sheetName], sheetCfg);
    console.log(
      `\n📄 ${sheetName} → ${sheetCfg.categorySlug} (${sheetCfg.type}): ${designs.length} designs`,
    );
    totalParsed += designs.length;

    const catId = categoryBySlug.get(sheetCfg.categorySlug);
    if (!catId) {
      console.warn(`   ⚠ Category '${sheetCfg.categorySlug}' missing in DB — skipping sheet`);
      totalSkipped += designs.length;
      continue;
    }

    for (const d of designs) {
      const shapeId = d.shapeSlug ? shapeBySlug.get(d.shapeSlug) : null;
      const displayName = d.productName || placeholderName(d);
      const slugify = (s: string) =>
        s
          .normalize("NFKD")
          .replace(/[̀-ͯ]/g, "") // strip diacritics: é → e, ñ → n
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      // SEO/AI-friendly: name first (keywords), code last (uniqueness anchor)
      const slug = `${slugify(displayName)}-${slugify(d.styleCode)}`;

      const data = {
        code: d.styleCode,
        slug,
        displayName,
        description: d.productDescription || "",
        category: catId,
        primaryShape: shapeId ?? null,
        isSolitaire: d.isSolitaire,
        isRing: sheetCfg.categorySlug === "rings",
        fulfillmentType: "made_to_order",
        status: "draft" as const,
        metals: d.metals,
        diamonds: d.diamonds.map((dia) => ({
          role: dia.role,
          shape: shapeId ?? null,
          sizeMm: dia.sizeMm,
          weightCt: dia.weightCt,
          count: dia.count,
        })),
        colorStones: [],
        remarks: d.remarks,
      };

      const existing = await payload.find({
        collection: "products",
        where: { code: { equals: d.styleCode } },
        limit: 1,
      });

      if (existing.totalDocs > 0) {
        await payload.update({
          collection: "products",
          id: existing.docs[0].id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: data as any,
        });
        totalUpdated++;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await payload.create({ collection: "products", data: data as any });
        totalCreated++;
      }
    }
  }

  console.log(`\n✅ Done.`);
  console.log(`   Parsed:  ${totalParsed}`);
  console.log(`   Created: ${totalCreated}`);
  console.log(`   Updated: ${totalUpdated}`);
  console.log(`   Skipped: ${totalSkipped}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Import failed:");
  console.error(err);
  process.exit(1);
});
