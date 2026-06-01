"use client";

/**
 * ProductImageManager — Shopify-style two-panel image manager for the Product admin page.
 *
 * LEFT PANEL  — large featured image for the active colour tab
 * RIGHT PANEL — colour tabs (All / Yellow / White / Rose) + scrollable thumbnail grid
 *
 * Per-tab hero:
 *   All tab    → global heroImage field
 *   Yellow tab → heroImageYellow (falls back to heroImage if unset)
 *   White tab  → heroImageWhite  (falls back to heroImage if unset)
 *   Rose tab   → heroImageRose   (falls back to heroImage if unset)
 *
 * Hover a thumbnail to reveal:
 *   [★ Set Hero]  — sets hero for the active tab
 *   [✕]           — removes from gallery (and clears per-tab hero if it was this image)
 *
 * Below each thumbnail: colour chips (Any / Yellow / White / Rose) always visible.
 *
 * Upload button: opens file picker → POSTs to /api/media → appends to gallery.
 * Drag-and-drop on the whole panel also works.
 */

import { useDocumentInfo, useField, useFormFields } from "@payloadcms/ui";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── types ────────────────────────────────────────────────────────────────────

type GalleryEntry = {
  id?: string | null;
  image?:
    | string
    | number
    | {
        id: string | number;
        url?: string;
        filename?: string;
        sizes?: { thumb?: { url?: string }; card?: { url?: string } };
      }
    | null;
  goldColor?: "" | "yellow" | "white" | "rose" | null;
};

type HeroImage =
  | string
  | number
  | {
      id: string | number;
      url?: string;
      filename?: string;
      sizes?: { thumb?: { url?: string }; card?: { url?: string } };
    }
  | null;

type ColorTab = "all" | "yellow" | "white" | "rose";

type ImageSlot = {
  id: string | number;
  url: string;
  filename: string;
  galleryIndex: number; // index in gallery array
  goldColor: "" | "yellow" | "white" | "rose";
};

// ─── constants ────────────────────────────────────────────────────────────────

const TABS: Array<{ value: ColorTab; label: string; color: string; dot: string }> = [
  { value: "all",    label: "All",    color: "#555",    dot: "#888"    },
  { value: "yellow", label: "Yellow", color: "#7a5c00", dot: "#f5c518" },
  { value: "white",  label: "White",  color: "#2a3a66", dot: "#99aacc" },
  { value: "rose",   label: "Rose",   color: "#7a2030", dot: "#e8a0a8" },
];

const GOLD_COLORS: Array<{
  value: "" | "yellow" | "white" | "rose";
  label: string;
  bg: string;
  border: string;
  text: string;
}> = [
  { value: "",       label: "Any",    bg: "#f5f5f5", border: "#ccc",    text: "#555"    },
  { value: "yellow", label: "Yellow", bg: "#fffbe6", border: "#f5c518", text: "#7a5c00" },
  { value: "white",  label: "White",  bg: "#f0f4ff", border: "#99aacc", text: "#2a3a66" },
  { value: "rose",   label: "Rose",   bg: "#fff0f2", border: "#e8a0a8", text: "#7a2030" },
];

const TAB_HERO_LABEL: Record<ColorTab, string> = {
  all:    "Global Hero",
  yellow: "Yellow Gold Hero",
  white:  "White Gold Hero",
  rose:   "Rose Gold Hero",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function resolveId(v: HeroImage | GalleryEntry["image"]): string | number | null {
  if (!v) return null;
  if (typeof v === "object" && "id" in v) return v.id;
  if (typeof v === "string" || typeof v === "number") return v;
  return null;
}

function resolveThumb(v: HeroImage | GalleryEntry["image"]): string {
  if (!v || typeof v !== "object") return "";
  const m = v as { url?: string; sizes?: { thumb?: { url?: string }; card?: { url?: string } } };
  return m.sizes?.thumb?.url ?? m.sizes?.card?.url ?? m.url ?? "";
}

function resolveName(v: HeroImage | GalleryEntry["image"]): string {
  if (!v || typeof v !== "object") return String(v ?? "");
  return (v as { filename?: string }).filename ?? "";
}

function buildSlots(gallery: GalleryEntry[]): ImageSlot[] {
  return gallery
    .map((entry, i) => {
      const imgId = resolveId(entry.image);
      if (!imgId) return null;
      return {
        id: imgId,
        url: resolveThumb(entry.image),
        filename: resolveName(entry.image),
        galleryIndex: i,
        goldColor: (entry.goldColor ?? "") as ImageSlot["goldColor"],
      };
    })
    .filter(Boolean) as ImageSlot[];
}

// ─── sub-components ───────────────────────────────────────────────────────────

function ColorChip({
  option,
  active,
  onClick,
}: {
  option: (typeof GOLD_COLORS)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 10,
        padding: "2px 6px",
        borderRadius: 10,
        border: `1px solid ${active ? option.border : "#ddd"}`,
        background: active ? option.bg : "#fafafa",
        color: active ? option.text : "#aaa",
        cursor: "pointer",
        fontWeight: active ? 700 : 400,
        transition: "all 0.1s",
        flexShrink: 0,
      }}
    >
      {option.label}
    </button>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

const ProductImageManager = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { id: docId } = useDocumentInfo();

  // ── form field bindings ────────────────────────────────────────────────────
  const { value: heroRaw,       setValue: setHero        } = useField<HeroImage>({ path: "heroImage"        });
  const { value: heroYellowRaw, setValue: setHeroYellow  } = useField<HeroImage>({ path: "heroImageYellow"  });
  const { value: heroWhiteRaw,  setValue: setHeroWhite   } = useField<HeroImage>({ path: "heroImageWhite"   });
  const { value: heroRoseRaw,   setValue: setHeroRose    } = useField<HeroImage>({ path: "heroImageRose"    });

  const galleryRaw = useFormFields(
    ([fields]) => fields?.gallery?.value,
  ) as GalleryEntry[] | null | undefined;
  const { setValue: setGalleryValue } = useField<GalleryEntry[]>({ path: "gallery" });

  // ── local state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]   = useState<ColorTab>("all");
  const [hoveredId, setHoveredId]   = useState<string | number | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [dragOver,  setDragOver]    = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── derived data ───────────────────────────────────────────────────────────
  const gallery: GalleryEntry[] = Array.isArray(galleryRaw) ? galleryRaw : [];
  const allSlots = buildSlots(gallery);

  const visibleSlots =
    activeTab === "all"
      ? allSlots
      : allSlots.filter((s) => s.goldColor === activeTab || s.goldColor === "");

  // Which hero image to display in the left panel for the active tab
  const featuredHeroRaw: HeroImage =
    activeTab === "all"    ? (heroRaw ?? null) :
    activeTab === "yellow" ? (heroYellowRaw ?? heroRaw ?? null) :
    activeTab === "white"  ? (heroWhiteRaw  ?? heroRaw ?? null) :
                             (heroRoseRaw   ?? heroRaw ?? null);

  const featuredUrl      = resolveThumb(featuredHeroRaw);
  const featuredFilename = resolveName(featuredHeroRaw);
  const featuredId       = resolveId(featuredHeroRaw);

  // Count images per tab for the tab badges
  const countForTab = (tab: ColorTab) =>
    tab === "all"
      ? allSlots.length
      : allSlots.filter((s) => s.goldColor === tab || s.goldColor === "").length;

  // ── actions ────────────────────────────────────────────────────────────────

  const setHeroForTab = useCallback(
    (slot: ImageSlot) => {
      const media = gallery[slot.galleryIndex]?.image ?? slot.id;
      if (activeTab === "all")    setHero(media as HeroImage);
      if (activeTab === "yellow") setHeroYellow(media as HeroImage);
      if (activeTab === "white")  setHeroWhite(media as HeroImage);
      if (activeTab === "rose")   setHeroRose(media as HeroImage);
    },
    [activeTab, gallery, setHero, setHeroYellow, setHeroWhite, setHeroRose],
  );

  const setColor = useCallback(
    (slot: ImageSlot, color: ImageSlot["goldColor"]) => {
      const newGallery = gallery.map((entry, i) =>
        i === slot.galleryIndex ? { ...entry, goldColor: color } : entry,
      );
      setGalleryValue(newGallery);
    },
    [gallery, setGalleryValue],
  );

  const removeSlot = useCallback(
    (slot: ImageSlot) => {
      const newGallery = gallery.filter((_, i) => i !== slot.galleryIndex);
      setGalleryValue(newGallery);
      // Clear any per-tab hero that referenced this image
      const id = slot.id;
      if (resolveId(heroRaw)       === id) setHero(null);
      if (resolveId(heroYellowRaw) === id) setHeroYellow(null);
      if (resolveId(heroWhiteRaw)  === id) setHeroWhite(null);
      if (resolveId(heroRoseRaw)   === id) setHeroRose(null);
    },
    [
      gallery, setGalleryValue,
      heroRaw, heroYellowRaw, heroWhiteRaw, heroRoseRaw,
      setHero, setHeroYellow, setHeroWhite, setHeroRose,
    ],
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true);
      const newEntries: GalleryEntry[] = [];
      for (const file of Array.from(files)) {
        try {
          const fd = new FormData();
          fd.append("file", file);
          // Use the dedicated admin upload route — returns { id, url, filename }
          const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
          if (!res.ok) {
            console.error("[ImageManager] upload failed:", res.status, await res.text());
            continue;
          }
          const data = await res.json() as { id?: string | number; url?: string; filename?: string };
          if (data?.id) {
            // Build a minimal media-like object Payload can store as a relationship
            newEntries.push({
              image: { id: data.id, url: data.url, filename: data.filename } as GalleryEntry["image"],
              goldColor: "",
            });
          }
        } catch (err) {
          console.error("[ImageManager] upload error:", err);
        }
      }
      if (newEntries.length > 0) {
        setGalleryValue([...gallery, ...newEntries]);
      }
      setUploading(false);
    },
    [gallery, setGalleryValue],
  );

  // ─────────────────────────────────────────────────────────────────────────

  if (!mounted) return null;
  if (!docId) {
    return (
      <div style={{ padding: 12, fontSize: 13, color: "var(--theme-elevation-500)" }}>
        Save the product first to manage images here.
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        marginTop: 8,
        padding: 16,
        background: dragOver
          ? "var(--theme-elevation-100, #eeeff5)"
          : "var(--theme-elevation-50, #f5f5f5)",
        border: dragOver
          ? "2px dashed #6c8ebf"
          : "1px solid var(--theme-elevation-150, #ddd)",
        borderRadius: 6,
        transition: "background 0.15s, border 0.15s",
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true);  }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) void uploadFiles(e.dataTransfer.files);
      }}
    >
      {/* ── header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--theme-elevation-500, #666)" }}>
          Image Manager
          {allSlots.length > 0 && (
            <span style={{ fontWeight: 400, marginLeft: 6 }}>— {allSlots.length} image{allSlots.length !== 1 ? "s" : ""}</span>
          )}
        </span>

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "5px 12px",
            borderRadius: 4,
            border: "1px solid var(--theme-elevation-300, #bbb)",
            background: uploading ? "#ddd" : "#fff",
            color: uploading ? "#aaa" : "var(--theme-text, #333)",
            cursor: uploading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          {uploading ? "Uploading…" : "↑ Upload images"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files?.length) void uploadFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {/* ── two-panel body ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

        {/* LEFT: featured image */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div
            style={{
              width: "100%",
              aspectRatio: "1",
              borderRadius: 8,
              overflow: "hidden",
              border: "2px solid #d4af37",
              background: "#f8f5ed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {featuredUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featuredUrl}
                alt={featuredFilename}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <span style={{ fontSize: 12, color: "#bbb", textAlign: "center", padding: 8 }}>
                No hero set for<br />{TAB_HERO_LABEL[activeTab]}
              </span>
            )}
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#d4af37", letterSpacing: "0.04em" }}>
              ★ {TAB_HERO_LABEL[activeTab]}
            </div>
            {featuredFilename ? (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--theme-elevation-600, #555)",
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={featuredFilename}
              >
                {featuredFilename}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>
                {activeTab !== "all" ? "Falls back to global hero" : "No hero image set"}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: tabs + grid */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              const count    = countForTab(tab.value);
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  style={{
                    display:        "flex",
                    alignItems:     "center",
                    gap:            5,
                    padding:        "5px 10px",
                    fontSize:       12,
                    fontWeight:     isActive ? 700 : 400,
                    borderRadius:   4,
                    border:         isActive
                                      ? `2px solid ${tab.dot}`
                                      : "1px solid var(--theme-elevation-200, #ddd)",
                    background:     isActive ? "#fff" : "transparent",
                    color:          isActive ? tab.color : "var(--theme-elevation-500, #888)",
                    cursor:         "pointer",
                    transition:     "all 0.12s",
                  }}
                >
                  {tab.value !== "all" && (
                    <span
                      style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: tab.dot,
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {tab.label}
                  <span
                    style={{
                      fontSize:       10,
                      fontWeight:     400,
                      background:     isActive ? tab.dot + "33" : "#eee",
                      color:          isActive ? tab.color : "#888",
                      borderRadius:   8,
                      padding:        "0 5px",
                      minWidth:       18,
                      textAlign:      "center",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Thumbnail grid */}
          {visibleSlots.length === 0 ? (
            <div
              style={{
                padding: "32px 0",
                textAlign: "center",
                fontSize: 13,
                color: "var(--theme-elevation-400, #aaa)",
                border: "2px dashed var(--theme-elevation-150, #ddd)",
                borderRadius: 6,
              }}
            >
              {allSlots.length === 0
                ? "No images yet — upload images or run pnpm import:images"
                : `No images tagged for ${activeTab} gold`}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                gap: 8,
              }}
            >
              {visibleSlots.map((slot) => {
                const isHeroForTab =
                  activeTab === "all"
                    ? resolveId(heroRaw) === slot.id
                    : activeTab === "yellow"
                    ? resolveId(heroYellowRaw ?? heroRaw) === slot.id
                    : activeTab === "white"
                    ? resolveId(heroWhiteRaw ?? heroRaw) === slot.id
                    : resolveId(heroRoseRaw ?? heroRaw) === slot.id;

                const isHovered = hoveredId === slot.id;

                return (
                  <div
                    key={slot.id}
                    onMouseEnter={() => setHoveredId(slot.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      position:     "relative",
                      borderRadius: 6,
                      overflow:     "hidden",
                      border:       isHeroForTab
                                      ? "2px solid #d4af37"
                                      : "1px solid var(--theme-elevation-200, #ddd)",
                      background:   "#fff",
                    }}
                  >
                    {/* Thumbnail image */}
                    <div style={{ width: "100%", aspectRatio: "1", position: "relative" }}>
                      {slot.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={slot.url}
                          alt={slot.filename}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%", height: "100%",
                            background: "#eee",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, color: "#aaa",
                          }}
                        >
                          No preview
                        </div>
                      )}

                      {/* Hero star badge */}
                      {isHeroForTab && (
                        <div
                          style={{
                            position:   "absolute", top: 4, left: 4,
                            background: "#d4af37", color: "#fff",
                            fontSize:   9, fontWeight: 700,
                            padding:    "1px 5px", borderRadius: 3,
                            letterSpacing: "0.05em",
                          }}
                        >
                          ★
                        </div>
                      )}

                      {/* Hover overlay */}
                      {isHovered && (
                        <div
                          style={{
                            position:       "absolute", inset: 0,
                            background:     "rgba(0,0,0,0.55)",
                            display:        "flex",
                            flexDirection:  "column",
                            alignItems:     "center",
                            justifyContent: "center",
                            gap:            5,
                            padding:        4,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setHeroForTab(slot)}
                            style={{
                              width:        "100%",
                              fontSize:     10,
                              fontWeight:   700,
                              padding:      "3px 0",
                              borderRadius: 3,
                              border:       "none",
                              background:   isHeroForTab ? "#d4af37" : "#ffffffcc",
                              color:        isHeroForTab ? "#fff" : "#333",
                              cursor:       isHeroForTab ? "default" : "pointer",
                            }}
                          >
                            {isHeroForTab ? "★ Hero" : "★ Set Hero"}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSlot(slot)}
                            style={{
                              width:        "100%",
                              fontSize:     10,
                              fontWeight:   600,
                              padding:      "3px 0",
                              borderRadius: 3,
                              border:       "none",
                              background:   "#ff4d4fcc",
                              color:        "#fff",
                              cursor:       "pointer",
                            }}
                          >
                            ✕ Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Colour chips — always visible below image */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: "4px 4px 3px" }}>
                      {GOLD_COLORS.map((opt) => (
                        <ColorChip
                          key={opt.value}
                          option={opt}
                          active={slot.goldColor === opt.value}
                          onClick={() => setColor(slot, opt.value)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── footer hint ────────────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          color: "var(--theme-elevation-400, #999)",
          lineHeight: 1.5,
        }}
      >
        Tag each image with its gold color — Yellow (1–4 renders), White (5–8), Rose (9–13). Lifestyle shots → <strong>Any</strong>.
        Hover a thumbnail to set it as hero or remove it. Changes apply on <strong>Save</strong>.
        {dragOver && (
          <span style={{ marginLeft: 8, color: "#6c8ebf", fontWeight: 600 }}>
            Drop images here…
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductImageManager;
