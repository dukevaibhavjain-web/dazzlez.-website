"use client";

/**
 * /upload — Internal media upload tool.
 *
 * Drag-and-drop (or click-to-browse) image uploader that pushes files to
 * Payload's media collection via POST /api/admin/upload.
 *
 * After upload, each card shows the image, its dimensions, and a one-click
 * "Copy URL" button so you can paste the URL straight into Payload admin
 * banner / tile fields.
 *
 * Accessible at http://localhost:3000/upload — no auth for the dev server.
 */

import { useState, useCallback, useRef, useEffect } from "react";

type FileEntry = {
  tempId: string;
  name: string;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  // populated on success
  resultUrl?: string;
  resultId?: string;
  width?: number | null;
  height?: number | null;
  // populated on error
  error?: string;
  // UI state
  copied?: boolean;
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
      <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 text-gray-300">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

export default function UploadPage() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0); // tracks nested drag events

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      entries.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    const tempId = `${Date.now()}-${Math.random()}`;
    const previewUrl = URL.createObjectURL(file);

    setEntries((prev) => [
      { tempId, name: file.name, previewUrl, status: "uploading" },
      ...prev,
    ]);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Upload failed");

      setEntries((prev) =>
        prev.map((e) =>
          e.tempId === tempId
            ? {
                ...e,
                status: "done",
                resultUrl: json.url,
                resultId: String(json.id),
                width: json.width,
                height: json.height,
              }
            : e,
        ),
      );
    } catch (err) {
      setEntries((prev) =>
        prev.map((e) =>
          e.tempId === tempId
            ? { ...e, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
            : e,
        ),
      );
    }
  }, []);

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      Array.from(fileList)
        .filter((f) => f.type.startsWith("image/"))
        .forEach(uploadFile);
    },
    [uploadFile],
  );

  // ── Drag handlers ────────────────────────────────────────────────────────
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); // required to allow drop
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  // ── Copy URL ─────────────────────────────────────────────────────────────
  const copyUrl = useCallback((tempId: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setEntries((prev) =>
        prev.map((e) => (e.tempId === tempId ? { ...e, copied: true } : e)),
      );
      setTimeout(
        () =>
          setEntries((prev) =>
            prev.map((e) => (e.tempId === tempId ? { ...e, copied: false } : e)),
          ),
        2000,
      );
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
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>
                📷 Media Upload
              </span>
              {uploadingCount > 0 && (
                <span style={{
                  fontSize: 12, fontWeight: 600, color: "#92400e",
                  background: "#fef3c7", padding: "2px 10px", borderRadius: 99,
                }}>
                  Uploading {uploadingCount}…
                </span>
              )}
            </div>
            <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
              Drop images here — they&apos;re saved to the Payload media library and resized automatically.
              Copy the URL and paste it into any banner or tile field in{" "}
              <a href="/admin" style={{ color: "#2563eb" }}>Payload Admin</a>.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "#2563eb" : "#d1d5db"}`,
              borderRadius: 16,
              background: dragging ? "#eff6ff" : "#ffffff",
              padding: "60px 40px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
              marginBottom: 32,
            }}
          >
            <div style={{ pointerEvents: "none" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <UploadIcon />
              </div>
              <p style={{ fontWeight: 600, color: dragging ? "#1d4ed8" : "#374151", marginBottom: 4, fontSize: 16 }}>
                {dragging ? "Drop to upload" : "Drag & drop images here"}
              </p>
              <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                or <span style={{ color: "#2563eb", textDecoration: "underline" }}>click to browse</span>
                {" "}· JPEG, PNG, WebP · max 10 MB each
              </p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{ display: "none" }}
            onChange={(e) => processFiles(e.target.files)}
          />

          {/* Results grid */}
          {entries.length > 0 && (
            <>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
              }}>
                <h2 style={{ fontWeight: 600, color: "#111827", margin: 0, fontSize: 15 }}>
                  Uploaded files · {doneCount} of {entries.length}
                </h2>
                <button
                  onClick={() => setEntries([])}
                  style={{
                    fontSize: 13, color: "#ef4444", background: "none", border: "none",
                    cursor: "pointer", padding: "4px 8px", borderRadius: 6,
                  }}
                >
                  Clear all
                </button>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 16,
              }}>
                {entries.map((entry) => (
                  <div
                    key={entry.tempId}
                    style={{
                      background: "#fff",
                      border: `1px solid ${
                        entry.status === "error" ? "#fca5a5"
                        : entry.status === "done" ? "#d1fae5"
                        : "#e5e7eb"
                      }`,
                      borderRadius: 12,
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: "relative", aspectRatio: "16/9", background: "#f3f4f6" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.previewUrl}
                        alt={entry.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />

                      {/* Status badge */}
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        background:
                          entry.status === "uploading" ? "rgba(0,0,0,0.55)"
                          : entry.status === "done" ? "#059669"
                          : "#dc2626",
                        color: "#fff",
                        fontSize: 11, fontWeight: 600, padding: "3px 8px",
                        borderRadius: 99, letterSpacing: "0.03em",
                      }}>
                        {entry.status === "uploading" ? "Uploading…"
                          : entry.status === "done" ? "Done"
                          : "Error"}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{
                        fontSize: 12, fontWeight: 600, color: "#111827",
                        margin: "0 0 2px", whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {entry.name}
                      </p>

                      {entry.width && entry.height && (
                        <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 10px" }}>
                          {entry.width} × {entry.height} px
                        </p>
                      )}

                      {entry.status === "done" && entry.resultUrl && (
                        <>
                          {/* URL display */}
                          <div style={{
                            background: "#f9fafb", border: "1px solid #e5e7eb",
                            borderRadius: 6, padding: "5px 8px", marginBottom: 8,
                            fontSize: 10, color: "#6b7280",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {entry.resultUrl}
                          </div>

                          {/* Copy button */}
                          <button
                            onClick={() => copyUrl(entry.tempId, entry.resultUrl!)}
                            style={{
                              width: "100%", display: "flex", alignItems: "center",
                              justifyContent: "center", gap: 6,
                              background: entry.copied ? "#d1fae5" : "#111827",
                              color: entry.copied ? "#065f46" : "#ffffff",
                              border: "none", borderRadius: 7, padding: "8px",
                              fontSize: 12, fontWeight: 600, cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            {entry.copied ? <CheckIcon /> : <CopyIcon />}
                            {entry.copied ? "Copied!" : "Copy URL"}
                          </button>
                        </>
                      )}

                      {entry.status === "error" && (
                        <p style={{
                          fontSize: 11, color: "#dc2626",
                          background: "#fef2f2", borderRadius: 6,
                          padding: "6px 8px", margin: 0,
                        }}>
                          {entry.error}
                        </p>
                      )}

                      {entry.status === "uploading" && (
                        <div style={{
                          height: 4, background: "#e5e7eb", borderRadius: 99, overflow: "hidden",
                        }}>
                          <div style={{
                            height: "100%", width: "60%",
                            background: "#2563eb", borderRadius: 99,
                            animation: "pulse 1s ease-in-out infinite",
                          }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </body>
    </html>
  );
}
