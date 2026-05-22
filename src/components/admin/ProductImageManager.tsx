"use client";

/**
 * ProductImageManager — admin UI field on the Product edit page.
 *
 * Renders all images for this product as a thumbnail grid. Per image:
 *   ★ Set as Hero   — promotes this image to heroImage
 *   Color chip row  — tags the gallery entry as Yellow / White / Rose / Any
 *
 * Reads live form state via Payload's useFormFields / useField so changes
 * wire into the normal Save flow — no separate API calls needed.
 *
 * Layout: up to 4 columns, scrollable. Mounted after hydration to avoid
 * SSR mismatch (same pattern as ProductPricePreview).
 */
import { useDocumentInfo, useField, useFormFields } from "@payloadcms/ui";
import { useEffect, useState, useCallback } from "react";

// ─── types ───────────────────────────────────────────────────────────────────

type GalleryEntry = {
  id?: string | null;
  image?: string | number | { id: string | number; url?: string; filename?: string; sizes?: { thumb?: { url?: string }; card?: { url?: string } } } | null;
  goldColor?: "" | "yellow" | "white" | "rose" | null;
};

type HeroImage =
  | string
  | number
  | { id: string | number; url?: string; filename?: string; sizes?: { thumb?: { url?: string }; card?: { url?: string } } }
  | null;

type ImageSlot = {
  id: string | number;
  url: string;
  filename: string;
  isHero: boolean;
  galleryIndex: number | null; // null = this IS the hero and not in gallery
  goldColor: "" | "yellow" | "white" | "rose";
};

const GOLD_COLORS: Array<{ value: "" | "yellow" | "white" | "rose"; label: string; bg: string; border: string; text: string }> = [
  { value: "",       label: "Any",    bg: "#f5f5f5", border: "#ccc",    text: "#555" },
  { value: "yellow", label: "Yellow", bg: "#fffbe6", border: "#f5c518", text: "#7a5c00" },
  { value: "white",  label: "White",  bg: "#f0f4ff", border: "#99aacc", text: "#2a3a66" },
  { value: "rose",   label: "Rose",   bg: "#fff0f2", border: "#e8a0a8", text: "#7a2030" },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

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

// ─── styles ──────────────────────────────────────────────────────────────────

const wrap: React.CSSProperties = {
  marginTop: 8,
  padding: 12,
  background: "var(--theme-elevation-50, #f5f5f5)",
  border: "1px solid var(--theme-elevation-150, #ddd)",
  borderRadius: 4,
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  color: "var(--theme-elevation-500, #666)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 10,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 10,
};

const card = (isHero: boolean): React.CSSProperties => ({
  border: isHero ? "2px solid #d4af37" : "1px solid var(--theme-elevation-200, #ddd)",
  borderRadius: 6,
  background: isHero ? "#fffdf0" : "#fff",
  padding: 6,
  display: "flex",
  flexDirection: "column",
  gap: 5,
  position: "relative",
});

const thumb: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1",
  objectFit: "cover",
  borderRadius: 3,
  background: "#eee",
  display: "block",
};

const heroBadge: React.CSSProperties = {
  position: "absolute",
  top: 8,
  left: 8,
  background: "#d4af37",
  color: "#fff",
  fontSize: 10,
  fontWeight: 700,
  padding: "2px 6px",
  borderRadius: 3,
  letterSpacing: "0.05em",
};

const heroBtn = (isHero: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "4px 0",
  fontSize: 11,
  fontWeight: 600,
  cursor: isHero ? "default" : "pointer",
  border: isHero ? "1px solid #d4af37" : "1px solid var(--theme-elevation-200, #ccc)",
  borderRadius: 3,
  background: isHero ? "#d4af37" : "transparent",
  color: isHero ? "#fff" : "var(--theme-text, #333)",
  opacity: isHero ? 1 : 0.85,
  transition: "all 0.15s",
});

const chipRow: React.CSSProperties = {
  display: "flex",
  gap: 3,
  flexWrap: "wrap",
};

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

  // Read heroImage field
  const { value: heroRaw, setValue: setHeroValue } = useField<HeroImage>({ path: "heroImage" });

  // Read full gallery field (array)
  const galleryRaw = useFormFields(([fields]) => fields?.gallery?.value) as GalleryEntry[] | null | undefined;
  const { setValue: setGalleryValue } = useField<GalleryEntry[]>({ path: "gallery" });

  // ── derive unified slot list ──────────────────────────────────────────────

  const slots: ImageSlot[] = [];
  const heroId = resolveId(heroRaw);

  // Hero image as slot 0 (if it has media)
  if (heroRaw) {
    slots.push({
      id: heroId!,
      url: resolveThumb(heroRaw),
      filename: resolveName(heroRaw),
      isHero: true,
      galleryIndex: null,
      goldColor: "",
    });
  }

  // Gallery entries (skip any that duplicate the hero by id)
  const gallery: GalleryEntry[] = Array.isArray(galleryRaw) ? galleryRaw : [];
  gallery.forEach((entry, i) => {
    const imgId = resolveId(entry.image);
    if (!imgId || imgId === heroId) return; // already shown as hero
    slots.push({
      id: imgId,
      url: resolveThumb(entry.image),
      filename: resolveName(entry.image),
      isHero: false,
      galleryIndex: i,
      goldColor: (entry.goldColor ?? "") as ImageSlot["goldColor"],
    });
  });

  // ── actions ───────────────────────────────────────────────────────────────

  const setHero = useCallback(
    (slot: ImageSlot) => {
      if (slot.isHero) return;

      // The new hero is the media object/id from this slot
      const newHeroMedia = slot.galleryIndex !== null ? gallery[slot.galleryIndex]?.image ?? slot.id : slot.id;

      // Remove from gallery, add old hero to gallery (preserving its goldColor)
      const oldHeroMedia = heroRaw;
      const newGallery: GalleryEntry[] = gallery
        .filter((_, i) => i !== slot.galleryIndex)
        .concat(
          oldHeroMedia
            ? [{ image: oldHeroMedia as GalleryEntry["image"], goldColor: "", id: undefined }]
            : [],
        );

      setHeroValue(newHeroMedia as HeroImage);
      setGalleryValue(newGallery);
    },
    [heroRaw, gallery, setHeroValue, setGalleryValue],
  );

  const setColor = useCallback(
    (slot: ImageSlot, color: ImageSlot["goldColor"]) => {
      if (slot.isHero || slot.galleryIndex === null) return; // hero has no goldColor tag
      const newGallery = gallery.map((entry, i) =>
        i === slot.galleryIndex ? { ...entry, goldColor: color } : entry,
      );
      setGalleryValue(newGallery);
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

  if (slots.length === 0) {
    return (
      <div style={{ padding: 12, fontSize: 13, color: "var(--theme-elevation-500)" }}>
        No images yet. Run <code>pnpm import:images</code> or upload via the fields above.
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={sectionLabel}>
        Image Manager — {slots.length} image{slots.length !== 1 ? "s" : ""}
        <span style={{ fontWeight: 400, marginLeft: 6 }}>
          (★ = hero · chip = gold color for gallery switcher)
        </span>
      </div>

      <div style={grid}>
        {slots.map((slot) => (
          <div key={slot.id} style={card(slot.isHero)}>
            {/* Thumbnail */}
            <div style={{ position: "relative" }}>
              {slot.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slot.url} alt={slot.filename} style={thumb} />
              ) : (
                <div
                  style={{
                    ...thumb,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: "#aaa",
                  }}
                >
                  No preview
                </div>
              )}
              {slot.isHero && <div style={heroBadge}>★ HERO</div>}
            </div>

            {/* Filename */}
            <div
              style={{
                fontSize: 10,
                color: "var(--theme-elevation-500, #888)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={slot.filename}
            >
              {slot.filename || `Image ${slot.id}`}
            </div>

            {/* Set as hero button */}
            <button
              type="button"
              disabled={slot.isHero}
              onClick={() => setHero(slot)}
              style={heroBtn(slot.isHero)}
            >
              {slot.isHero ? "★ Hero" : "Set as Hero"}
            </button>

            {/* Gold color chips — only for gallery images (hero has no tag) */}
            {!slot.isHero && (
              <div style={chipRow}>
                {GOLD_COLORS.map((opt) => (
                  <ColorChip
                    key={opt.value}
                    option={opt}
                    active={slot.goldColor === opt.value}
                    onClick={() => setColor(slot, opt.value)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 11,
          color: "var(--theme-elevation-400, #999)",
          lineHeight: 1.5,
        }}
      >
        Changes take effect when you click <strong>Save</strong>. Tag each render with its gold
        color — Yellow (1–4), White (5–8), Rose (9–13). Leave lifestyle shots as{" "}
        <strong>Any</strong>.
      </div>
    </div>
  );
};

export default ProductImageManager;
