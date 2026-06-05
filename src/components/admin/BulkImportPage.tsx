"use client";

/**
 * BulkImportPage — 3-step wizard for importing products + images.
 *
 * Step 1 — Upload:   Choose Excel (.xlsx) + optional image source (ZIP or folder)
 * Step 2 — Preview:  Review parsed products, see new vs existing, check diffs, select rows
 * Step 3 — Import:   Live progress: products upserted → images uploaded → linked
 *
 * Image ZIP handling: extracted in the browser via JSZip (no Vercel body-size limit).
 * Folder handling: uses <input webkitdirectory> (no ZIP needed, no RAM overhead).
 *
 * Registered as a Payload admin custom view via payload.config.ts.
 */

import { useState, useRef, useCallback } from "react";
import type { ParsedProduct } from "@/app/api/admin/import-products/route";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_CODE_RE = /^[A-Z]+-\d+$/i;
const MAX_IMAGES = 16;

// ─── Image helpers (mirrors import-images.ts logic) ───────────────────────────

function isImageFile(name: string) {
  return /\.(jpe?g|png|webp)$/i.test(name);
}

type SortableImage = { name: string; size: number; getData: () => Promise<ArrayBuffer> };

/** Select + sort images for one product folder — same rules as the CLI script. */
function selectImages(images: SortableImage[], code: string): SortableImage[] {
  const codeLower = code.toLowerCase();

  // Dedup by base filename: prefer PNG over JPEG, then larger size
  const deduped = new Map<string, SortableImage>();
  for (const img of images) {
    const lower = img.name.toLowerCase();
    const base  = lower.replace(/\.[^.]+$/, "");
    const ext   = lower.split(".").pop() ?? "";
    const prev  = deduped.get(base);
    if (!prev) { deduped.set(base, img); continue; }
    const prevExt = prev.name.toLowerCase().split(".").pop() ?? "";
    if (ext === "png" && prevExt !== "png") { deduped.set(base, img); continue; }
    if (ext !== "png" && prevExt === "png") continue;
    if (img.size > prev.size) deduped.set(base, img);
  }

  type Cl = { img: SortableImage; kind: "render" | "lifestyle" | "other"; order: number };
  const classified: Cl[] = Array.from(deduped.values()).map((img) => {
    const lower = img.name.toLowerCase();
    const noExt = lower.replace(/\.[^.]+$/, "");
    let kind: Cl["kind"] = "other";
    let order = 999;
    if (lower.includes(codeLower)) {
      kind = "render";
      const m = noExt.match(/\((\d+)\)/);
      order = m ? parseInt(m[1], 10) : 500;
    } else if (/^\d+\.\d+/.test(lower) || /lifestyle|model|hand|wear/i.test(lower)) {
      kind = "lifestyle"; order = 0;
    }
    return { img, kind, order };
  });

  const kw = { render: 0, lifestyle: 1, other: 2 } as const;
  classified.sort((a, b) => {
    const d = kw[a.kind] - kw[b.kind];
    if (d !== 0) return d;
    if (a.order !== b.order) return a.order - b.order;
    return a.img.name.localeCompare(b.img.name);
  });

  return classified.slice(0, MAX_IMAGES).map((c) => c.img);
}

// ─── ZIP scanner ──────────────────────────────────────────────────────────────

/** Extract product-code image groups from a ZIP file (JSZip, browser-side). */
async function scanZip(file: File): Promise<Map<string, SortableImage[]>> {
  // Dynamic import to avoid SSR issues and keep the chunk out of the initial bundle.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let JSZip: any;
  try {
    JSZip = (await import("jszip")).default;
  } catch {
    throw new Error("JSZip is not installed. Run: pnpm install");
  }

  const zip = await JSZip.loadAsync(file);
  const byCode = new Map<string, SortableImage[]>();

  for (const [zipPath, entry] of Object.entries(zip.files) as [string, { dir: boolean; _data?: { uncompressedSize?: number }; async: (t: string) => Promise<ArrayBuffer> }][]) {
    if (entry.dir) continue;
    const baseName = zipPath.split("/").pop() ?? "";
    if (!isImageFile(baseName)) continue;

    // Find first path segment matching a product code
    const codeSegment = zipPath.split("/").find((s) => PRODUCT_CODE_RE.test(s));
    if (!codeSegment) continue;

    const code = codeSegment.toUpperCase();
    if (!byCode.has(code)) byCode.set(code, []);
    byCode.get(code)!.push({
      name: baseName,
      size: entry._data?.uncompressedSize ?? 0,
      getData: () => entry.async("arraybuffer"),
    });
  }

  return byCode;
}

/** Extract product-code image groups from a webkitdirectory FileList. */
function scanFolder(files: FileList): Map<string, SortableImage[]> {
  const byCode = new Map<string, SortableImage[]>();
  for (const file of Array.from(files)) {
    if (!isImageFile(file.name)) continue;
    const parts = file.webkitRelativePath.split("/");
    const codeSegment = parts.find((s) => PRODUCT_CODE_RE.test(s));
    if (!codeSegment) continue;
    const code = codeSegment.toUpperCase();
    const f = file; // capture
    if (!byCode.has(code)) byCode.set(code, []);
    byCode.get(code)!.push({
      name: file.name,
      size: file.size,
      getData: () => f.arrayBuffer(),
    });
  }
  return byCode;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "upload" | "preview" | "importing" | "done";
type ImgSourceType = "zip" | "folder";

type ProductRow = {
  code: string;
  step: "waiting" | "product-ok" | "product-err" | "images-uploading" | "images-done" | "images-err";
  productNote?: string;
  imageDone: number;
  imageTotal: number;
  imageNote?: string;
};

type Summary = {
  created: number; updated: number; skipped: number; productErrors: number;
  imagesUploaded: number; productsLinked: number;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:  { maxWidth: 900, margin: "0 auto", padding: "28px 20px", fontFamily: "inherit" },
  h1:    { fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "var(--theme-text,#111)" },
  sub:   { fontSize: 13, color: "var(--theme-elevation-500,#666)", margin: "0 0 24px" },
  card:  { background: "var(--theme-elevation-50,#f8f8f8)", border: "1px solid var(--theme-elevation-150,#e0e0e0)", borderRadius: 8, padding: 20, marginBottom: 16 },
  row:   { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  label: { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--theme-elevation-500,#888)", marginBottom: 6 },
  fileBtn:  { fontSize: 12, padding: "6px 12px", borderRadius: 4, border: "1px solid var(--theme-elevation-300,#bbb)", background: "#fff", cursor: "pointer" },
  pill:     { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, display: "inline-block" },
  tabRow:   { display: "flex", gap: 4, marginBottom: 14 },
  tableWrap:{ overflowX: "auto", fontSize: 12 },
  table:    { width: "100%", borderCollapse: "collapse" },
  th:       { padding: "8px 10px", textAlign: "left", fontWeight: 600, borderBottom: "2px solid var(--theme-elevation-200,#ddd)", whiteSpace: "nowrap" },
  td:       { padding: "7px 10px", borderBottom: "1px solid var(--theme-elevation-100,#f0f0f0)", verticalAlign: "top" },
  errBox:   { background: "#fff2f0", border: "1px solid #fca5a5", borderRadius: 6, padding: "10px 14px", fontSize: 12, color: "#991b1b", marginBottom: 14 },
  bar:      { height: 6, borderRadius: 3, background: "var(--theme-elevation-150,#e0e0e0)", overflow: "hidden", marginTop: 6 },
  mono:     { fontFamily: "monospace", fontSize: 11 },
};

function Pill({ label, color }: { label: string; color: "green" | "blue" | "amber" | "red" | "gray" }) {
  const bg = { green: "#d1fae5", blue: "#dbeafe", amber: "#fef3c7", red: "#fee2e2", gray: "#f3f4f6" };
  const fg = { green: "#065f46", blue: "#1e40af", amber: "#92400e", red: "#991b1b", gray: "#374151" };
  return <span style={{ ...S.pill, background: bg[color], color: fg[color] }}>{label}</span>;
}

function PrimaryBtn({ children, onClick, disabled, loading }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 6,
        border: "none", background: disabled || loading ? "#93c5fd" : "#2563eb",
        color: "#fff", cursor: disabled || loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "Working…" : children}
    </button>
  );
}

function ProgressBar({ done, total, color }: { done: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666" }}>
        <span>{done} / {total}</span><span>{pct}%</span>
      </div>
      <div style={S.bar}>
        <div style={{ height: "100%", width: `${pct}%`, background: color ?? "#2563eb", transition: "width 0.2s" }} />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BulkImportPage() {
  const [step, setStep]               = useState<Step>("upload");
  const [imgSourceType, setImgType]   = useState<ImgSourceType>("zip");
  const [excelFile, setExcelFile]     = useState<File | null>(null);
  const [zipFile, setZipFile]         = useState<File | null>(null);
  const [folderFiles, setFolderFiles] = useState<FileList | null>(null);

  const [previews, setPreviews]       = useState<ParsedProduct[]>([]);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [imageCounts, setImageCounts] = useState<Map<string, number>>(new Map());

  const [rows, setRows]               = useState<ProductRow[]>([]);
  const [summary, setSummary]         = useState<Summary | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);

  const excelRef  = useRef<HTMLInputElement>(null);
  const zipRef    = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  // ── helpers ────────────────────────────────────────────────────────────────

  const updateRow = useCallback((code: string, patch: Partial<ProductRow>) => {
    setRows((prev) => prev.map((r) => (r.code === code ? { ...r, ...patch } : r)));
  }, []);

  const hasImages = imgSourceType === "zip" ? !!zipFile : !!folderFiles;

  // ── Step 1 → Step 2: parse Excel + scan images ────────────────────────────

  const handlePreview = useCallback(async () => {
    if (!excelFile) return;
    setError(null);
    setLoading(true);
    try {
      // 1. Parse Excel via server
      const fd = new FormData();
      fd.append("file", excelFile);
      const res = await fetch("/api/admin/import-products", { method: "POST", body: fd });
      const data = await res.json() as { products?: ParsedProduct[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Server error");

      const products = data.products ?? [];
      setPreviews(products);
      setSelected(new Set(products.map((p) => p.code)));

      // 2. Scan image source for folder counts
      if (hasImages) {
        let byCode: Map<string, SortableImage[]>;
        if (imgSourceType === "zip" && zipFile) {
          byCode = await scanZip(zipFile);
        } else if (imgSourceType === "folder" && folderFiles) {
          byCode = scanFolder(folderFiles);
        } else {
          byCode = new Map();
        }
        const counts = new Map<string, number>();
        for (const [code, imgs] of byCode) {
          counts.set(code, selectImages(imgs, code).length);
        }
        setImageCounts(counts);
      } else {
        setImageCounts(new Map());
      }

      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  }, [excelFile, zipFile, folderFiles, imgSourceType, hasImages]);

  // ── Step 2 → Step 3: run import ───────────────────────────────────────────

  const handleImport = useCallback(async () => {
    const chosen = previews.filter((p) => selected.has(p.code));
    if (chosen.length === 0) return;

    setError(null);
    setLoading(true);

    // Initialise progress rows
    setRows(chosen.map((p) => ({
      code: p.code,
      step: "waiting",
      imageDone: 0,
      imageTotal: imageCounts.get(p.code) ?? 0,
    })));
    setStep("importing");

    const sum: Summary = { created: 0, updated: 0, skipped: 0, productErrors: 0, imagesUploaded: 0, productsLinked: 0 };

    // ── 1. Upsert all selected products in one server call ──────────────────
    let productResults: Array<{ code: string; action: string; error?: string }> = [];
    try {
      const res = await fetch("/api/admin/import-products/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: chosen }),
      });
      const data = await res.json() as {
        results?: typeof productResults;
        summary?: { created: number; updated: number; skipped: number; errors: number };
        error?: string;
      };
      if (!res.ok || data.error) throw new Error(data.error ?? "Products import failed");
      productResults = data.results ?? [];
      // Use server-computed summary as source of truth — avoids any client-side
      // closure/batching issues that could leave the local `sum` at zero.
      if (data.summary) {
        sum.created      = data.summary.created;
        sum.updated      = data.summary.updated;
        sum.skipped      = data.summary.skipped;
        sum.productErrors = data.summary.errors;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Products import failed");
      setLoading(false);
      return;
    }

    // Update per-row progress UI — counts already set from server summary above,
    // so only call updateRow here (no local incrementing).
    for (const r of productResults) {
      if (r.action === "created")       updateRow(r.code, { step: "product-ok",  productNote: "✅ Created" });
      else if (r.action === "updated")  updateRow(r.code, { step: "product-ok",  productNote: "♻️ Updated" });
      else if (r.action === "skipped")  updateRow(r.code, { step: "product-err", productNote: `⏭️ ${r.error ?? "Skipped"}` });
      else                              updateRow(r.code, { step: "product-err", productNote: `❌ ${r.error}` });
    }

    // ── 2. Upload + link images product by product ──────────────────────────
    if (hasImages) {
      // Build image map (do ZIP scan or folder scan once)
      let byCode: Map<string, SortableImage[]>;
      try {
        if (imgSourceType === "zip" && zipFile) {
          byCode = await scanZip(zipFile);
        } else if (imgSourceType === "folder" && folderFiles) {
          byCode = scanFolder(folderFiles);
        } else {
          byCode = new Map();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Image scan failed");
        setLoading(false);
        return;
      }

      for (const product of chosen) {
        const rawImages = byCode.get(product.code.toUpperCase());
        if (!rawImages || rawImages.length === 0) {
          updateRow(product.code, { step: "images-done", imageNote: "No images found in source" });
          continue;
        }

        const sorted = selectImages(rawImages, product.code);
        updateRow(product.code, { step: "images-uploading", imageTotal: sorted.length, imageDone: 0 });

        const mediaIds: (string | number)[] = [];
        let uploadError = false;

        for (const img of sorted) {
          try {
            const buf = await img.getData();
            const mimeType = img.name.toLowerCase().endsWith(".png") ? "image/png"
              : img.name.toLowerCase().endsWith(".webp") ? "image/webp" : "image/jpeg";
            const blob = new Blob([buf], { type: mimeType });
            const fd = new FormData();
            fd.append("file", blob, img.name);

            const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
            const data = await res.json() as { id?: string | number; error?: string };
            if (!res.ok || !data.id) throw new Error(data.error ?? "Upload failed");

            mediaIds.push(data.id);
            sum.imagesUploaded++;
            updateRow(product.code, { imageDone: mediaIds.length });
          } catch (err) {
            uploadError = true;
            updateRow(product.code, {
              step: "images-err",
              imageNote: `Upload error on ${img.name}: ${err instanceof Error ? err.message : "unknown"}`,
            });
            break;
          }
        }

        if (!uploadError && mediaIds.length > 0) {
          // Link images to the product
          try {
            const res = await fetch("/api/admin/link-product-images", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: product.code, mediaIds }),
            });
            const data = await res.json() as { ok?: boolean; error?: string };
            if (!res.ok || !data.ok) throw new Error(data.error ?? "Link failed");
            sum.productsLinked++;
            updateRow(product.code, { step: "images-done", imageNote: `${mediaIds.length} images linked` });
          } catch (err) {
            updateRow(product.code, { step: "images-err", imageNote: `Link error: ${err instanceof Error ? err.message : "unknown"}` });
          }
        }
      }
    }

    setSummary(sum);
    setStep("done");
    setLoading(false);
  }, [previews, selected, imageCounts, hasImages, imgSourceType, zipFile, folderFiles, updateRow]);

  // ── Renders ────────────────────────────────────────────────────────────────

  const renderUpload = () => (
    <div>
      {/* Excel card */}
      <div style={S.card}>
        <span style={S.label}>1 — Products spreadsheet (.xlsx)</span>
        <div style={S.row}>
          <button type="button" style={S.fileBtn} onClick={() => excelRef.current?.click()}>
            Choose file
          </button>
          <span style={{ fontSize: 12, color: excelFile ? "#111" : "#aaa" }}>
            {excelFile ? excelFile.name : "No file chosen"}
          </span>
          {excelFile && (
            <button type="button" onClick={() => setExcelFile(null)}
              style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>✕</button>
          )}
        </div>
        <input ref={excelRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
          onChange={(e) => { setExcelFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
        <p style={{ fontSize: 11, color: "#888", margin: "6px 0 0" }}>
          Same format as the existing Excel file — sheets named by category (rings, earrings, etc.)
        </p>
      </div>

      {/* Image source card */}
      <div style={S.card}>
        <span style={S.label}>2 — Product images (optional)</span>

        {/* Toggle ZIP / Folder */}
        <div style={S.tabRow}>
          {(["zip", "folder"] as const).map((t) => (
            <button key={t} type="button"
              onClick={() => setImgType(t)}
              style={{
                fontSize: 12, padding: "5px 14px", borderRadius: 20, cursor: "pointer",
                border: imgSourceType === t ? "2px solid #2563eb" : "1px solid #ddd",
                background: imgSourceType === t ? "#eff6ff" : "#fff",
                fontWeight: imgSourceType === t ? 700 : 400,
                color: imgSourceType === t ? "#1d4ed8" : "#555",
              }}>
              {t === "zip" ? "📦 Upload ZIP" : "📁 Select Folder"}
            </button>
          ))}
        </div>

        {imgSourceType === "zip" ? (
          <>
            <div style={S.row}>
              <button type="button" style={S.fileBtn} onClick={() => zipRef.current?.click()}>Choose ZIP</button>
              <span style={{ fontSize: 12, color: zipFile ? "#111" : "#aaa" }}>
                {zipFile ? `${zipFile.name} (${(zipFile.size / 1024 / 1024).toFixed(0)} MB)` : "No file chosen"}
              </span>
              {zipFile && (
                <button type="button" onClick={() => setZipFile(null)}
                  style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>✕</button>
              )}
            </div>
            <input ref={zipRef} type="file" accept=".zip" style={{ display: "none" }}
              onChange={(e) => { setZipFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
            <p style={{ fontSize: 11, color: "#888", margin: "6px 0 0" }}>
              ZIP with subfolders named by SKU code (e.g. RR-001/) — same structure as existing imports.
              Large ZIPs (1 GB+) are extracted in your browser; allow 3–5 min.
            </p>
          </>
        ) : (
          <>
            <div style={S.row}>
              <button type="button" style={S.fileBtn} onClick={() => folderRef.current?.click()}>Choose Folder</button>
              <span style={{ fontSize: 12, color: folderFiles ? "#111" : "#aaa" }}>
                {folderFiles ? `${folderFiles.length} files selected` : "No folder chosen"}
              </span>
              {folderFiles && (
                <button type="button" onClick={() => setFolderFiles(null)}
                  style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>✕</button>
              )}
            </div>
            <input ref={folderRef} type="file" style={{ display: "none" }}
              // @ts-expect-error – webkitdirectory is not in HTMLInputElement typings
              webkitdirectory="true" multiple
              onChange={(e) => { setFolderFiles(e.target.files && e.target.files.length > 0 ? e.target.files : null); e.target.value = ""; }} />
            <p style={{ fontSize: 11, color: "#888", margin: "6px 0 0" }}>
              Select the parent folder that contains subfolders named by SKU code (e.g. RR-001/).
              No decompression needed — most efficient for large sets.
            </p>
          </>
        )}
      </div>

      {error && <div style={S.errBox}>⚠️ {error}</div>}

      <PrimaryBtn onClick={handlePreview} disabled={!excelFile} loading={loading}>
        Preview Products →
      </PrimaryBtn>
    </div>
  );

  const renderPreview = () => {
    const newCount      = previews.filter((p) => p.dbStatus === "new").length;
    const existingCount = previews.filter((p) => p.dbStatus === "existing").length;
    const withImages    = previews.filter((p) => imageCounts.get(p.code) ?? 0).length;
    const selectedCount = selected.size;

    return (
      <div>
        {/* Summary chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <Pill label={`${previews.length} total`} color="gray" />
          <Pill label={`${newCount} new`} color="green" />
          <Pill label={`${existingCount} existing`} color="blue" />
          {imageCounts.size > 0 && <Pill label={`${withImages} have images`} color="amber" />}
          <Pill label={`${selectedCount} selected`} color={selectedCount > 0 ? "blue" : "red"} />
        </div>

        {/* Bulk-select buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[
            ["Select All",       () => setSelected(new Set(previews.map((p) => p.code)))],
            ["Select New Only",  () => setSelected(new Set(previews.filter((p) => p.dbStatus === "new").map((p) => p.code)))],
            ["Deselect All",     () => setSelected(new Set<string>())],
          ].map(([label, fn]) => (
            <button key={label as string} type="button"
              onClick={fn as () => void}
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 4, cursor: "pointer", border: "1px solid #ddd", background: "#fff" }}>
              {label as string}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={S.tableWrap}>
          <table style={S.table as React.CSSProperties}>
            <thead>
              <tr>
                <th style={S.th as React.CSSProperties}><input type="checkbox"
                  checked={selectedCount === previews.length && previews.length > 0}
                  onChange={(e) => e.target.checked
                    ? setSelected(new Set(previews.map((p) => p.code)))
                    : setSelected(new Set())} /></th>
                <th style={S.th as React.CSSProperties}>Code</th>
                <th style={S.th as React.CSSProperties}>Display Name</th>
                <th style={S.th as React.CSSProperties}>Category</th>
                <th style={S.th as React.CSSProperties}>Metals</th>
                <th style={S.th as React.CSSProperties}>Status</th>
                <th style={S.th as React.CSSProperties}>Images</th>
              </tr>
            </thead>
            <tbody>
              {previews.map((p) => {
                const isSelected = selected.has(p.code);
                const imgCount   = imageCounts.get(p.code) ?? 0;
                return (
                  <tr key={p.code}
                    style={{ background: isSelected ? "transparent" : "var(--theme-elevation-50,#f9f9f9)", opacity: isSelected ? 1 : 0.55 }}
                    onClick={() => setSelected((prev) => {
                      const next = new Set(prev);
                      next.has(p.code) ? next.delete(p.code) : next.add(p.code);
                      return next;
                    })}
                  >
                    <td style={S.td as React.CSSProperties} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected}
                        onChange={() => setSelected((prev) => {
                          const next = new Set(prev); next.has(p.code) ? next.delete(p.code) : next.add(p.code); return next;
                        })} />
                    </td>
                    <td style={{ ...S.td as React.CSSProperties, ...S.mono }}>{p.code}</td>
                    <td style={S.td as React.CSSProperties}>
                      <div>{p.displayName}</div>
                      {p.diff.length > 0 && (
                        <div style={{ marginTop: 3 }}>
                          {p.diff.map((d) => (
                            <div key={d.field} style={{ fontSize: 10, color: "#92400e", background: "#fef3c7", padding: "1px 5px", borderRadius: 3, marginTop: 1 }}>
                              {d.field}: "{d.oldVal}" → "{d.newVal}"
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={S.td as React.CSSProperties}>{p.categorySlug}</td>
                    <td style={S.td as React.CSSProperties}>{p.metals.map((m) => m.purity).join(", ")}</td>
                    <td style={S.td as React.CSSProperties}>
                      <Pill label={p.dbStatus === "new" ? "🆕 New" : "♻️ Existing"} color={p.dbStatus === "new" ? "green" : "blue"} />
                      {!p.categoryId && <Pill label="⚠️ No category" color="red" />}
                    </td>
                    <td style={S.td as React.CSSProperties}>
                      {imgCount > 0 ? <Pill label={`${imgCount} imgs`} color="amber" /> : <span style={{ color: "#aaa" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {error && <div style={S.errBox}>⚠️ {error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center" }}>
          <button type="button"
            onClick={() => { setStep("upload"); setError(null); }}
            style={{ fontSize: 12, padding: "8px 14px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>
            ← Back
          </button>
          <PrimaryBtn onClick={handleImport} disabled={selectedCount === 0} loading={loading}>
            Start Import ({selectedCount} products) →
          </PrimaryBtn>
        </div>
      </div>
    );
  };

  const renderImporting = () => {
    const productDone   = rows.filter((r) => r.step.startsWith("product") || r.step.startsWith("images")).length;
    const imagesDone    = rows.reduce((s, r) => s + r.imageDone, 0);
    const imagesTotal   = rows.reduce((s, r) => s + r.imageTotal, 0);

    return (
      <div>
        <div style={S.card}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Products</div>
            <ProgressBar done={productDone} total={rows.length} />
          </div>
          {imagesTotal > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Images</div>
              <ProgressBar done={imagesDone} total={imagesTotal} color="#059669" />
            </div>
          )}
        </div>

        <div style={{ ...S.tableWrap, maxHeight: 420, overflowY: "auto" }}>
          <table style={S.table as React.CSSProperties}>
            <thead>
              <tr>
                <th style={S.th as React.CSSProperties}>Code</th>
                <th style={S.th as React.CSSProperties}>Product</th>
                <th style={S.th as React.CSSProperties}>Images</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code}>
                  <td style={{ ...S.td as React.CSSProperties, ...S.mono }}>{r.code}</td>
                  <td style={S.td as React.CSSProperties}>
                    {r.step === "waiting"      && <span style={{ color: "#aaa" }}>⏳ Waiting…</span>}
                    {r.step === "product-ok"   && <span style={{ color: "#065f46" }}>{r.productNote}</span>}
                    {r.step === "product-err"  && <span style={{ color: "#991b1b" }}>{r.productNote}</span>}
                    {r.step.startsWith("images") && <span style={{ color: "#065f46" }}>{r.productNote ?? "✅"}</span>}
                  </td>
                  <td style={S.td as React.CSSProperties}>
                    {r.imageTotal > 0 && (
                      <>
                        <span style={{ fontSize: 11, color: "#555" }}>{r.imageDone}/{r.imageTotal}</span>
                        {r.step === "images-uploading" && (
                          <div style={{ ...S.bar, marginTop: 3 }}>
                            <div style={{ height: "100%", width: `${Math.round((r.imageDone / r.imageTotal) * 100)}%`, background: "#059669", transition: "width 0.15s" }} />
                          </div>
                        )}
                        {r.step === "images-done"  && <span style={{ marginLeft: 6, color: "#059669", fontSize: 11 }}>✓ linked</span>}
                        {r.step === "images-err"   && <span style={{ marginLeft: 6, color: "#991b1b", fontSize: 11 }}>{r.imageNote}</span>}
                      </>
                    )}
                    {r.imageTotal === 0 && r.step.startsWith("images") && (
                      <span style={{ color: "#aaa", fontSize: 11 }}>{r.imageNote ?? "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDone = () => (
    <div>
      <div style={{ ...S.card, border: "1px solid #6ee7b7", background: "#ecfdf5" }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#065f46" }}>✅ Import Complete</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
          {[
            ["Created",    summary?.created,       "#d1fae5", "#065f46"],
            ["Updated",    summary?.updated,       "#dbeafe", "#1e40af"],
            ["Skipped",    summary?.skipped,       "#fef3c7", "#92400e"],
            ["Errors",     summary?.productErrors, "#fee2e2", "#991b1b"],
            ["Imgs uploaded", summary?.imagesUploaded, "#d1fae5", "#065f46"],
            ["Prods linked",  summary?.productsLinked, "#d1fae5", "#065f46"],
          ].map(([label, val, bg, fg]) => (
            <div key={label as string} style={{ background: bg as string, color: fg as string, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{val ?? 0}</div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{label as string}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button type="button"
          onClick={() => {
            setStep("upload"); setExcelFile(null); setZipFile(null); setFolderFiles(null);
            setPreviews([]); setSelected(new Set()); setImageCounts(new Map());
            setRows([]); setSummary(null); setError(null);
          }}
          style={{ fontSize: 13, fontWeight: 600, padding: "9px 18px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>
          Import Another Batch
        </button>
        <a href="/admin/collections/products"
          style={{ fontSize: 13, fontWeight: 600, padding: "9px 18px", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
          View Products →
        </a>
      </div>
    </div>
  );

  // ── Breadcrumb / step indicator ───────────────────────────────────────────

  const STEPS = [
    { key: "upload",    label: "Upload" },
    { key: "preview",   label: "Preview" },
    { key: "importing", label: "Import" },
    { key: "done",      label: "Done" },
  ] as const;
  const stepIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Bulk Import</h1>
      <p style={S.sub as React.CSSProperties}>
        Import products from an Excel sheet and automatically link images from a ZIP or folder by SKU code.
      </p>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 0, marginBottom: 28, alignItems: "center" }}>
        {STEPS.map((s, i) => {
          const active = s.key === step;
          const done   = i < stepIdx;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                background: active ? "#2563eb" : done ? "#d1fae5" : "var(--theme-elevation-100,#eee)",
                color: active ? "#fff" : done ? "#065f46" : "#888",
                border: active ? "2px solid #2563eb" : "2px solid transparent",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ marginLeft: 6, fontSize: 12, fontWeight: active ? 700 : 400, color: active ? "#2563eb" : done ? "#065f46" : "#888" }}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div style={{ width: 32, height: 2, background: done ? "#a7f3d0" : "var(--theme-elevation-150,#e0e0e0)", margin: "0 8px" }} />}
            </div>
          );
        })}
      </div>

      {step === "upload"    && renderUpload()}
      {step === "preview"   && renderPreview()}
      {step === "importing" && renderImporting()}
      {step === "done"      && renderDone()}
    </div>
  );
}

export default BulkImportPage;
