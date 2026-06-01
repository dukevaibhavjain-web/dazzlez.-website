/**
 * Image ingester — walks a zip OR folder, finds subfolders named by product
 * code (e.g. RR-001), selects up to 8 images using the rules below, and
 * uploads them via Payload's media collection. First image becomes hero,
 * rest go into gallery.
 *
 * Selection rules:
 *  1. Filter to .jpg/.jpeg/.png/.webp. Skip .3dm/.stl/.mp4/etc.
 *  2. Categorize:
 *      - render    = filename contains the product code  → comes FIRST
 *      - lifestyle = filename does NOT contain the code  → comes LAST
 *  3. For PNG/JPG duplicates of same shot — pick the larger file ("better").
 *  4. Order: renders in numerical order (1, 2, … 13), then lifestyle, then others.
 *     First render (1) becomes the hero — the Yellow Gold catalogue shot.
 *  5. Take first MAX_IMAGES_PER_PRODUCT (16 to fit all 13 renders + lifestyle).
 *
 * Idempotent: re-running skips images whose filename + product is already
 * uploaded.
 *
 * Usage:
 *   pnpm import:images <path-to-zip-or-folder>
 *   pnpm import:images   (uses default: 52 RINGS.zip)
 */
import StreamZip from "node-stream-zip";
import fs from "fs";
import path from "path";
import os from "os";
import { getPayload } from "payload";
import config from "../src/payload.config.js";

const DEFAULT_FILE =
  "C:/Users/Vaibhav/Desktop/Dazzlez Co/DESIGN/Chetan/2025 designs/52 RINGS.zip";
const MAX_IMAGES_PER_PRODUCT = 16; // 13 renders (all gold colors) + up to 3 lifestyle
const PRODUCT_CODE_REGEX = /^[A-Z]+-\d+$/i; // e.g. RR-001, ER-001

function isImageFile(filename: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(filename);
}

function isCadOrVideoFile(filename: string): boolean {
  return /\.(3dm|stl|obj|blend|mp4|mov|avi)$/i.test(filename);
}

type Selected = { filePath: string; size: number; kind: "lifestyle" | "render" | "other"; order: number };

function selectImages(folderPath: string, productCode: string, max: number): string[] {
  const files = fs.readdirSync(folderPath);
  const codeLower = productCode.toLowerCase();
  const candidates: Selected[] = [];
  const dedupe = new Map<string, Selected[]>(); // logical key → variants

  for (const f of files) {
    if (!isImageFile(f)) continue;
    const full = path.join(folderPath, f);
    const stat = fs.statSync(full);
    if (!stat.isFile()) continue;

    const lower = f.toLowerCase();
    const noExt = lower.replace(/\.[^.]+$/, "");

    // Determine kind + render order
    let kind: Selected["kind"] = "other";
    let order = 999;
    if (lower.includes(codeLower)) {
      kind = "render";
      // Pull a numeric tag like (1), (10), etc. for sort order
      const m = noExt.match(/\((\d+)\)/);
      order = m ? parseInt(m[1], 10) : 500;
    } else if (/^\d+\.\d+/.test(lower) || /lifestyle|model|hand|wear/i.test(lower)) {
      kind = "lifestyle";
      order = 0; // lifestyle sorts first within its group; group itself comes last
    }

    const entry: Selected = { filePath: full, size: stat.size, kind, order };
    const dedupeKey = `${kind}-${noExt}`;
    if (!dedupe.has(dedupeKey)) dedupe.set(dedupeKey, []);
    dedupe.get(dedupeKey)!.push(entry);
  }

  // Resolve PNG/JPG duplicates — pick larger
  for (const group of dedupe.values()) {
    group.sort((a, b) => b.size - a.size); // largest first
    candidates.push(group[0]);
  }

  // Final order: renders first (hero = render (1) = Yellow Gold catalogue shot),
  // then lifestyle shots, then others. kindWeight drives the group order.
  const kindWeight = { render: 0, lifestyle: 1, other: 2 } as const;
  candidates.sort((a, b) => {
    const kw = kindWeight[a.kind] - kindWeight[b.kind];
    if (kw !== 0) return kw;
    if (a.order !== b.order) return a.order - b.order;
    return a.filePath.localeCompare(b.filePath);
  });

  return candidates.slice(0, max).map((c) => c.filePath);
}

function findProductFolders(
  root: string,
  depth = 0,
): Array<{ code: string; folderPath: string }> {
  const results: Array<{ code: string; folderPath: string }> = [];
  if (depth > 4) return results;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const full = path.join(root, e.name);
    if (PRODUCT_CODE_REGEX.test(e.name)) {
      results.push({ code: e.name.toUpperCase(), folderPath: full });
    } else {
      results.push(...findProductFolders(full, depth + 1));
    }
  }
  return results;
}

async function extractZipToTemp(zipPath: string): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dazzlez-img-"));
  console.log(`📦 Extracting ${path.basename(zipPath)} → ${tmpDir}`);
  const zip = new StreamZip.async({ file: zipPath });

  // Filter: only extract image files (skip .3dm/.stl/.mp4 to save time + disk)
  const entries = await zip.entries();
  let extractedCount = 0;
  for (const [name, entry] of Object.entries(entries)) {
    if (entry.isDirectory) continue;
    const basename = path.basename(name);
    if (isCadOrVideoFile(basename)) continue;
    if (!isImageFile(basename)) continue;

    const targetPath = path.join(tmpDir, name);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    await zip.extract(name, targetPath);
    extractedCount++;
    if (extractedCount % 50 === 0) {
      process.stdout.write(`\r   ${extractedCount} files extracted...`);
    }
  }
  await zip.close();
  console.log(`\r   ✓ ${extractedCount} image files extracted.            `);
  return tmpDir;
}

function mimeFor(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith("--"));
  const limitArg = process.argv.find(a => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : Infinity;

  const arg = args[0];
  const inputPath = arg ? path.resolve(arg) : DEFAULT_FILE;

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Path not found: ${inputPath}`);
    process.exit(1);
  }

  // Connect to DB first — Neon free tier auto-suspends after 5 min idle.
  // ZIP extraction takes ~8 min, so connecting after extraction times out.
  const payload = await getPayload({ config });

  let workDir = inputPath;
  let tmpDir: string | null = null;

  const stat = fs.statSync(inputPath);
  if (!stat.isDirectory() && inputPath.toLowerCase().endsWith(".zip")) {
    tmpDir = await extractZipToTemp(inputPath);
    workDir = tmpDir;
  }

  console.log(`\n🔍 Scanning ${workDir} for product-code folders...`);
  const allFolders = findProductFolders(workDir);
  const productFolders = isFinite(limit) ? allFolders.slice(0, limit) : allFolders;
  console.log(`   Found ${allFolders.length} product folders${isFinite(limit) ? `, importing first ${limit}` : ""}.\n`);

  let updated = 0;
  let skipped = 0;
  let totalImages = 0;
  let totalReused = 0;

  for (const { code, folderPath } of productFolders) {
    const found = await payload.find({
      collection: "products",
      where: { code: { equals: code } },
      limit: 1,
    });
    if (found.totalDocs === 0) {
      console.log(`  ⚠ ${code}: product not in DB, skipping folder`);
      skipped++;
      continue;
    }
    const product = found.docs[0];

    const imagePaths = selectImages(folderPath, code, MAX_IMAGES_PER_PRODUCT);
    if (imagePaths.length === 0) {
      console.log(`  ⚠ ${code}: no images found, skipping`);
      skipped++;
      continue;
    }

    const mediaIds: Array<string | number> = [];
    let reusedThisProduct = 0;

    for (const imgPath of imagePaths) {
      const filename = path.basename(imgPath);

      // Idempotency: skip if media with same filename already linked to this product
      const existing = await payload.find({
        collection: "media",
        where: { filename: { equals: filename } },
        limit: 1,
      });

      if (existing.totalDocs > 0) {
        mediaIds.push(existing.docs[0].id);
        reusedThisProduct++;
        continue;
      }

      const fileBuffer = fs.readFileSync(imgPath);
      const created = await payload.create({
        collection: "media",
        file: {
          data: fileBuffer,
          name: filename,
          mimetype: mimeFor(filename),
          size: fileBuffer.length,
        },
        data: { alt: `${product.displayName ?? code} — image` },
      });
      mediaIds.push(created.id);
    }

    // Determine defaultGoldColor from the product's metal recipe:
    //   Gold purities (any K) → "yellow"  (Yellow Gold is the standard catalogue colour)
    //   Silver 925 or Platinum only  → "white"  (white-gold renders are closest match)
    // Admin can always override this in the Product edit page.
    const metals = (product as unknown as { metals?: Array<{ purity: string }> }).metals ?? [];
    const hasGold = metals.some((m) => /^\d+K$/i.test(m.purity));
    const defaultGoldColor = hasGold ? "yellow" : "white";

    // Update product: hero = first render (1) = Yellow Gold catalogue shot, gallery = rest.
    // goldColor is left blank ("any") — admin uses the Image Manager UI to tag per colour.
    await payload.update({
      collection: "products",
      id: product.id,
      data: {
        heroImage: mediaIds[0] as number,
        defaultGoldColor,
        gallery: mediaIds.slice(1).map((id) => ({ image: id as number, goldColor: "" as const })),
      },
    });

    totalImages += mediaIds.length;
    totalReused += reusedThisProduct;
    updated++;
    console.log(
      `  ✓ ${code}: ${mediaIds.length} images${reusedThisProduct > 0 ? ` (${reusedThisProduct} reused)` : ""}`,
    );
  }

  if (tmpDir) {
    console.log(`\n🧹 Cleaning up temp dir...`);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log(`\n✅ Done.`);
  console.log(`   Products updated: ${updated}`);
  console.log(`   Skipped:          ${skipped}`);
  console.log(`   Images uploaded:  ${totalImages - totalReused}`);
  console.log(`   Images reused:    ${totalReused}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Image ingest failed:");
  console.error(err);
  process.exit(1);
});
