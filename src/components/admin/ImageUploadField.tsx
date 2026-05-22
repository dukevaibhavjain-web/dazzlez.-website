"use client";

/**
 * ImageUploadField — Custom Payload admin field component for image URL fields.
 *
 * Replaces the plain text input with an inline upload + URL widget.
 * Registered via admin.components.Field in CollectionBanners and
 * CollectionMarketingTiles — no separate /upload page needed.
 *
 * Supports three input methods:
 *   1. Drag & drop onto the drop zone
 *   2. Click the drop zone to browse files
 *   3. Paste / type an image URL and click "Use URL"
 *
 * Uploads go to POST /api/admin/upload (Payload media collection).
 * Pasted URLs are set directly — no upload round-trip.
 *
 * Uses Payload's useField hook so the value lives in the document form
 * and is saved normally when the user clicks Save.
 */

import { useCallback, useRef, useState } from "react";
import type { DragEvent } from "react";
import { useField } from "@payloadcms/ui";

// ── Props ────────────────────────────────────────────────────────────────────
// Payload passes `field` (the client field config) and `path` to every custom
// Field component. We only need the parts below; type the rest as unknown.
type Props = {
  path: string;
  /** Payload client field config — contains label, required, admin.description */
  field?: {
    label?: string | false | null | Record<string, string>;
    required?: boolean;
    admin?: { description?: string };
  };
  readOnly?: boolean;
};

// ── Component ────────────────────────────────────────────────────────────────
export function ImageUploadField({ path, field, readOnly }: Props) {
  const { value, setValue } = useField<string>({ path });

  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragCounter, setDragCounter] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const isDragging = dragCounter > 0;

  // Resolve label: Payload may send a string, an i18n Record, or false.
  const labelStr =
    typeof field?.label === "string"
      ? field.label
      : typeof field?.label === "object" && field.label !== null
        ? (field.label["en"] ?? Object.values(field.label)[0] ?? undefined)
        : undefined;

  const description = field?.admin?.description;

  // ── Upload ──────────────────────────────────────────────────────────────
  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = (await res.json()) as { url?: string; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        setValue(json.url ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [setValue],
  );

  const handleFiles = (files: FileList | null) => {
    if (!files?.[0] || readOnly || uploading) return;
    uploadFile(files[0]);
  };

  // ── Drag events ─────────────────────────────────────────────────────────
  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    setDragCounter((n) => n + 1);
  };
  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setDragCounter((n) => Math.max(0, n - 1));
  };
  const onDragOver = (e: DragEvent) => e.preventDefault();
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragCounter(0);
    handleFiles(e.dataTransfer.files);
  };

  // ── URL paste ───────────────────────────────────────────────────────────
  const handleUrlSet = () => {
    const url = urlInput.trim();
    if (!url || readOnly) return;
    setValue(url);
    setUrlInput("");
    setError(null);
  };

  // ── Styles (inline — avoids adding CSS files to the admin bundle) ────────
  const s = {
    wrap: { marginBottom: 16 } as React.CSSProperties,
    label: {
      display: "block",
      marginBottom: 6,
      fontWeight: 600,
      fontSize: "0.75rem",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      color: "var(--theme-elevation-600)",
    } as React.CSSProperties,
    required: { color: "var(--theme-error-500, #dc2626)", marginLeft: 4 } as React.CSSProperties,
    desc: {
      fontSize: 12,
      color: "var(--theme-elevation-500)",
      marginTop: -2,
      marginBottom: 10,
    } as React.CSSProperties,
    // preview block
    preview: { position: "relative" as const, marginBottom: 4 } as React.CSSProperties,
    img: {
      width: "100%",
      maxHeight: 160,
      objectFit: "cover" as const,
      borderRadius: 6,
      border: "1px solid var(--theme-elevation-150)",
      display: "block",
    } as React.CSSProperties,
    removeBtn: {
      position: "absolute" as const,
      top: 6,
      right: 6,
      background: "rgba(0,0,0,0.65)",
      color: "#fff",
      border: "none",
      borderRadius: 4,
      padding: "3px 8px",
      fontSize: 12,
      cursor: "pointer",
      lineHeight: 1.4,
    } as React.CSSProperties,
    urlText: {
      fontSize: 11,
      color: "var(--theme-elevation-500)",
      wordBreak: "break-all" as const,
      margin: 0,
    } as React.CSSProperties,
    // drop zone
    dropZone: (dragging: boolean, busy: boolean) =>
      ({
        border: `2px dashed ${dragging ? "#4f46e5" : "var(--theme-elevation-200)"}`,
        borderRadius: 8,
        padding: "18px 16px",
        textAlign: "center" as const,
        cursor: busy ? "default" : "pointer",
        background: dragging ? "rgba(79,70,229,0.05)" : "var(--theme-elevation-50)",
        transition: "border-color 0.15s, background 0.15s",
        marginBottom: 8,
        userSelect: "none" as const,
      }) as React.CSSProperties,
    hint: { margin: 0, fontWeight: 600, fontSize: 13 } as React.CSSProperties,
    hintSub: { margin: "4px 0 0", fontSize: 11, color: "var(--theme-elevation-500)" } as React.CSSProperties,
    error: { color: "var(--theme-error-500, #dc2626)", fontSize: 12, margin: "0 0 8px" } as React.CSSProperties,
    urlRow: { display: "flex", gap: 8, marginTop: 2 } as React.CSSProperties,
    urlInput: {
      flex: 1,
      padding: "8px 10px",
      fontSize: 13,
      border: "1px solid var(--theme-elevation-200)",
      borderRadius: 6,
      background: "transparent",
      color: "inherit",
      outline: "none",
    } as React.CSSProperties,
    urlBtn: (active: boolean) =>
      ({
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: 600,
        background: "var(--theme-elevation-800, #1e293b)",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        cursor: active ? "pointer" : "not-allowed",
        opacity: active ? 1 : 0.45,
        whiteSpace: "nowrap",
      }) as React.CSSProperties,
  };

  return (
    <div style={s.wrap}>
      {/* Label */}
      {labelStr && (
        <label htmlFor={`field-${path}`} style={s.label}>
          {labelStr}
          {field?.required && <span style={s.required}>*</span>}
        </label>
      )}
      {description && <p style={s.desc}>{description}</p>}

      {/* Current image preview */}
      {value && (
        <div style={{ marginBottom: 12 }}>
          <div style={s.preview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Current image"
              style={s.img}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  setValue("");
                  setError(null);
                }}
                title="Remove image"
                style={s.removeBtn}
              >
                ✕ Remove
              </button>
            )}
          </div>
          <p style={s.urlText}>{value}</p>
        </div>
      )}

      {/* Upload controls — hidden in read-only mode */}
      {!readOnly && (
        <>
          {/* Drop zone */}
          <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={() => !uploading && fileRef.current?.click()}
            style={s.dropZone(isDragging, uploading)}
          >
            <input
              ref={fileRef}
              id={`field-${path}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {uploading ? (
              <p style={s.hint}>⏳ Uploading…</p>
            ) : (
              <>
                <p style={s.hint}>
                  {isDragging ? "↓ Drop to upload" : "⬆ Drag & drop or click to browse"}
                </p>
                <p style={s.hintSub}>JPEG · PNG · WebP · max 10 MB</p>
              </>
            )}
          </div>

          {/* Error */}
          {error && <p style={s.error}>⚠ {error}</p>}

          {/* URL paste */}
          <div style={s.urlRow}>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleUrlSet();
                }
              }}
              placeholder="Or paste an image URL…"
              style={s.urlInput}
            />
            <button
              type="button"
              onClick={handleUrlSet}
              disabled={!urlInput.trim()}
              style={s.urlBtn(!!urlInput.trim())}
            >
              Use URL
            </button>
          </div>
        </>
      )}
    </div>
  );
}
