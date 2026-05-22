"use client";

/**
 * /upload — Internal media upload tool.
 *
 * Three ways to add an image:
 *   1. Drag & drop onto the drop zone
 *   2. Click the drop zone to browse files
 *   3. Paste an external URL into the URL input
 *
 * Uploaded files go to Payload's media collection via POST /api/admin/upload.
 * Pasted URLs are added directly as cards (no upload needed).
 *
 * Each card shows a preview + "Copy URL" button. Copy the URL and paste it
 * into Image URL or Mobile Image URL fields in Payload Admin.
 */

import { useState, useCallback, useRef, useEffect } from "react";

type FileEntry = {
  tempId: string;
  name: string;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  resultUrl?: string;
  resultId?: string;
  width?: number | null;
  height?: number | null;
  error?: string;
  copied?: boolean;
  /** true = came from URL paste, not file upload */
  isPasted?: boolean;
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
      <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
      <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 48, height: 48, color: "#d1d5db" }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, color: "#6b7280" }}>
      <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
      <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
    </svg>
  );
}

const S = {
  card: (status: FileEntry["status"]): React.CSSProperties => ({
    background: "#fff",
    border: `1px solid ${status === "error" ? "#fca5a5" : status === "done" ? "#d1fae5" : "#e5e7eb"}`,
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
  }),
  badge: (status: FileEntry["status"]): React.CSSProperties => ({
    position: "absolute", top: 8, right: 8,
    background: status === "uploading" ? "rgba(0,0,0,0.55)" : status === "done" ? "#059669" : "#dc2626",
    color: "#fff", fontSize: 11, fontWeight: 600,
    padding: "3px 8px", borderRadius: 99, letterSpacing: "0.03em",
  }),
};

export default function UploadPage() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    return () => entries.forEach((e) => !e.isPasted && URL.revokeObjectURL(e.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── File upload ────────────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File) => {
    const tempId = `file-${Date.now()}-${Math.random()}`;
    const previewUrl = URL.createObjectURL(file);
    setEntries((p) => [{ tempId, name: file.name, previewUrl, status: "uploading" }, ...p]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setEntries((p) => p.map((e) => e.tempId === tempId
        ? { ...e, status: "done", resultUrl: json.url, resultId: String(json.id), width: json.width, height: json.height }
        : e));
    } catch (err) {
      setEntries((p) => p.map((e) => e.tempId === tempId
        ? { ...e, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
        : e));
    }
  }, []);

  const processFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    Array.from(list).filter((f) => f.type.startsWith("image/")).forEach(uploadFile);
  }, [uploadFile]);

  // ── Paste URL ─────────────────────────────────────────────────────────────
  const addUrl = useCallback((raw: string) => {
    const url = raw.trim();
    if (!url || !url.startsWith("http")) return;
    const tempId = `url-${Date.now()}-${Math.random()}`;
    const name = url.split("/").pop()?.split("?")[0] || "image";
    setEntries((p) => [{
      tempId, name, previewUrl: url,
      status: "done", resultUrl: url, isPasted: true,
    }, ...p]);
    setUrlInput("");
    urlInputRef.current?.focus();
  }, []);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); dragCounter.current++; setDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragging(false); }, []);
  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); dragCounter.current = 0; setDragging(false); processFiles(e.dataTransfer.files);
  }, [processFiles]);

  // ── Copy URL ──────────────────────────────────────────────────────────────
  const copyUrl = useCallback((tempId: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setEntries((p) => p.map((e) => e.tempId === tempId ? { ...e, copied: true } : e));
      setTimeout(() => setEntries((p) => p.map((e) => e.tempId === tempId ? { ...e, copied: false } : e)), 2000);
    });
  }, []);

  const doneCount = entries.filter((e) => e.status === "done").length;
  const uploadingCount = entries.filter((e) => e.status === "uploading").length;

  return (
    <html lang="en">
      <head>
        <title>Media Upload — Dazzlez Admin</title>
        <meta name="robots" content="noindex" />
      </head>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f9fafb" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>📷 Media Upload</span>
              {uploadingCount > 0 && (
                <span style={{ fontSize: 12, fontWeight: 600, color: "#92400e", background: "#fef3c7", padding: "2px 10px", borderRadius: 99 }}>
                  Uploading {uploadingCount}…
                </span>
              )}
            </div>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "14px 18px" }}>
              <p style={{ fontWeight: 600, color: "#1e40af", margin: "0 0 6px", fontSize: 13 }}>How to add a banner or tile image</p>
              <ol style={{ color: "#1e3a8a", fontSize: 13, margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
                <li>Add an image below (drag & drop, browse, or paste a URL)</li>
                <li>Click <strong>Copy URL</strong> on the image card</li>
                <li>Go to{" "}
                  <a href="/admin/collections/collection-banners" target="_blank" style={{ color: "#2563eb" }}>Collection Banners</a>{" "}or{" "}
                  <a href="/admin/collections/collection-marketing-tiles" target="_blank" style={{ color: "#2563eb" }}>Marketing Tiles</a>{" "}
                  in Payload Admin</li>
                <li>Paste into <strong>Image URL</strong> or <strong>Mobile Image URL</strong> and save</li>
              </ol>
            </div>
          </div>

          {/* ── Method 1 + 2: Drag & drop / click to browse ──────────────── */}
          <div
            onDragEnter={onDragEnter} onDragLeave={onDragLeave}
            onDragOver={onDragOver} onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "#2563eb" : "#d1d5db"}`,
              borderRadius: 16, background: dragging ? "#eff6ff" : "#ffffff",
              padding: "52px 40px", textAlign: "center", cursor: "pointer",
              transition: "all 0.15s ease", marginBottom: 16,
            }}
          >
            <div style={{ pointerEvents: "none" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><UploadIcon /></div>
              <p style={{ fontWeight: 600, color: dragging ? "#1d4ed8" : "#374151", marginBottom: 4, fontSize: 16 }}>
                {dragging ? "Drop to upload" : "Drag & drop images here"}
              </p>
              <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                or <span style={{ color: "#2563eb", textDecoration: "underline" }}>click to browse files</span>
                {" "}· JPEG, PNG, WebP · max 10 MB
              </p>
            </div>
          </div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: "none" }} onChange={(e) => processFiles(e.target.files)} />

          {/* ── Method 3: Paste a URL ─────────────────────────────────────── */}
          <div style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
            padding: "18px 20px", marginBottom: 32,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <LinkIcon />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Or paste an image URL</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                ref={urlInputRef}
                type="url"
                value={urlInput}
                placeholder="https://example.com/banner.jpg"
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addUrl(urlInput)}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (text.startsWith("http")) { e.preventDefault(); addUrl(text); }
                }}
                style={{
                  flex: 1, padding: "9px 12px", border: "1px solid #d1d5db",
                  borderRadius: 8, fontSize: 13, outline: "none",
                  color: "#111827",
                }}
              />
              <button
                onClick={() => addUrl(urlInput)}
                style={{
                  padding: "9px 18px", background: "#111827", color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                Add URL
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: "8px 0 0" }}>
              Paste any public image URL — it&apos;s added to the list below immediately without uploading.
            </p>
          </div>

          {/* ── Results grid ──────────────────────────────────────────────── */}
          {entries.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{ fontWeight: 600, color: "#111827", margin: 0, fontSize: 15 }}>
                  Images · {doneCount} ready
                </h2>
                <button onClick={() => setEntries([])} style={{ fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>
                  Clear all
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                {entries.map((entry) => (
                  <div key={entry.tempId} style={S.card(entry.status)}>
                    {/* Thumbnail */}
                    <div style={{ position: "relative", aspectRatio: "16/9", background: "#f3f4f6" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={entry.previewUrl} alt={entry.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <div style={S.badge(entry.status)}>
                        {entry.status === "uploading" ? "Uploading…" : entry.status === "done" ? (entry.isPasted ? "URL added" : "Uploaded") : "Error"}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {entry.name}
                      </p>
                      {entry.width && entry.height && (
                        <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 10px" }}>{entry.width} × {entry.height} px</p>
                      )}

                      {entry.status === "done" && entry.resultUrl && (
                        <>
                          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 8px", marginBottom: 8, fontSize: 10, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {entry.resultUrl}
                          </div>
                          <button
                            onClick={() => copyUrl(entry.tempId, entry.resultUrl!)}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                              background: entry.copied ? "#d1fae5" : "#111827",
                              color: entry.copied ? "#065f46" : "#fff",
                              border: "none", borderRadius: 7, padding: "8px",
                              fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                            }}
                          >
                            {entry.copied ? <CheckIcon /> : <CopyIcon />}
                            {entry.copied ? "Copied!" : "Copy URL"}
                          </button>
                        </>
                      )}

                      {entry.status === "error" && (
                        <p style={{ fontSize: 11, color: "#dc2626", background: "#fef2f2", borderRadius: 6, padding: "6px 8px", margin: 0 }}>
                          {entry.error}
                        </p>
                      )}

                      {entry.status === "uploading" && (
                        <div style={{ height: 4, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: "60%", background: "#2563eb", borderRadius: 99, animation: "pulse 1s ease-in-out infinite" }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </body>
    </html>
  );
}
