"use client";

/**
 * Custom field component for the complementaryProducts relationship.
 * Replaces the flat search picker with a Category → Sub-category → Products
 * hierarchical browser so admin can navigate and tick products easily.
 *
 * Requires `export default` — Payload importMap uses the default export.
 */

import { useField } from "@payloadcms/ui";
import { useEffect, useState } from "react";

type Cat = { id: number; name: string };
type Sub = { id: number; name: string };
type Prod = { id: number; code: string; displayName: string };

// Payload relationship values can be IDs or pre-populated objects.
type RelVal = number | { id: number; displayName?: string; code?: string };

function ProductComplementaryPicker() {
  const { value, setValue } = useField<RelVal[]>({ path: "complementaryProducts" });

  const [categories, setCategories] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [products, setProducts] = useState<Prod[]>([]);

  const [catId, setCatId] = useState("");
  const [subId, setSubId] = useState("");
  const [search, setSearch] = useState("");

  // --- normalise field value ---
  const selectedIds: number[] = (value ?? []).map((v) =>
    typeof v === "object" ? v.id : v,
  );
  // Build a name cache from pre-populated objects
  const nameCache = new Map<number, string>(
    (value ?? [])
      .filter((v): v is { id: number; displayName?: string; code?: string } =>
        typeof v === "object",
      )
      .map((v) => [v.id, v.displayName ?? v.code ?? `#${v.id}`]),
  );

  // --- fetch categories once ---
  useEffect(() => {
    fetch("/api/categories?limit=100&depth=0&sort=name", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => setCategories(d.docs ?? []))
      .catch(() => {});
  }, []);

  // --- fetch sub-categories when category changes ---
  useEffect(() => {
    setSubs([]);
    setSubId("");
    setProducts([]);
    if (!catId) return;
    fetch(
      `/api/sub-categories?where[category][equals]=${catId}&limit=100&depth=0&sort=name`,
      { credentials: "include" },
    )
      .then((r) => r.json())
      .then((d) => setSubs(d.docs ?? []))
      .catch(() => {});
  }, [catId]);

  // --- fetch products when category or sub-category changes ---
  useEffect(() => {
    setProducts([]);
    if (!catId) return;
    const base = subId
      ? `/api/products?where[subCategory][equals]=${subId}&limit=150&depth=0`
      : `/api/products?where[category][equals]=${catId}&limit=150&depth=0`;
    fetch(base, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setProducts(d.docs ?? []))
      .catch(() => {});
  }, [catId, subId]);

  const filtered = search.trim()
    ? products.filter(
        (p) =>
          p.code.toLowerCase().includes(search.toLowerCase()) ||
          p.displayName.toLowerCase().includes(search.toLowerCase()),
      )
    : products;

  const toggle = (p: Prod) => {
    if (selectedIds.includes(p.id)) {
      setValue(selectedIds.filter((id) => id !== p.id));
    } else {
      setValue([...selectedIds, p.id]);
    }
  };

  const remove = (id: number) => setValue(selectedIds.filter((i) => i !== id));

  // inline styles — Payload admin doesn't use Tailwind
  const chip: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#1B2B4B",
    color: "#FAF7F2",
    borderRadius: 999,
    padding: "3px 10px 3px 12px",
    fontSize: 12,
    fontWeight: 500,
    marginRight: 6,
    marginBottom: 6,
  };
  const xBtn: React.CSSProperties = {
    background: "rgba(255,255,255,.25)",
    border: "none",
    borderRadius: "50%",
    width: 16,
    height: 16,
    lineHeight: "16px",
    cursor: "pointer",
    color: "#FAF7F2",
    fontSize: 11,
    padding: 0,
    flexShrink: 0,
  };
  const sel: React.CSSProperties = {
    padding: "6px 10px",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: 13,
    width: "100%",
    marginBottom: 6,
  };
  const inp: React.CSSProperties = {
    ...sel,
    marginBottom: 0,
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontWeight: 600,
          fontSize: 13,
          marginBottom: 8,
          color: "#333",
        }}
      >
        Complementary Products — Match &amp; Shine
      </label>

      {/* ── Selected chips ─────────────────────────────────────────── */}
      <div
        style={{
          minHeight: 32,
          marginBottom: 12,
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {selectedIds.length === 0 ? (
          <span style={{ color: "#888", fontSize: 13 }}>
            No products selected. Browse below to add.
          </span>
        ) : (
          selectedIds.map((id) => (
            <span key={id} style={chip}>
              {nameCache.get(id) ?? `#${id}`}
              <button type="button" style={xBtn} onClick={() => remove(id)}>
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {/* ── Hierarchical browser ───────────────────────────────────── */}
      <div
        style={{
          border: "1px solid #e0e0e0",
          borderRadius: 6,
          padding: 12,
          background: "#fafafa",
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: "#888",
            marginBottom: 8,
            marginTop: 0,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Browse by Category → Sub-category → Products
        </p>

        {/* Category */}
        <select value={catId} onChange={(e) => setCatId(e.target.value)} style={sel}>
          <option value="">— Select a Category —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Sub-category (only shown when subs exist) */}
        {subs.length > 0 && (
          <select value={subId} onChange={(e) => setSubId(e.target.value)} style={sel}>
            <option value="">— All Sub-categories —</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {/* Search within fetched products */}
        {products.length > 0 && (
          <input
            type="text"
            placeholder="Filter by code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inp, marginBottom: 6 }}
          />
        )}

        {/* Product list */}
        {filtered.length > 0 && (
          <div
            style={{
              maxHeight: 200,
              overflowY: "auto",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
              background: "#fff",
              marginTop: 6,
            }}
          >
            {filtered.map((p) => {
              const selected = selectedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "7px 12px",
                    border: "none",
                    borderBottom: "1px solid #f0f0f0",
                    background: selected ? "#EEF2FF" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                  }}
                >
                  {/* Checkbox indicator */}
                  <span
                    style={{
                      flexShrink: 0,
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      border: `2px solid ${selected ? "#1B2B4B" : "#ccc"}`,
                      background: selected ? "#1B2B4B" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selected && (
                      <span style={{ color: "#fff", fontSize: 9, lineHeight: 1 }}>✓</span>
                    )}
                  </span>
                  <span style={{ color: "#999", minWidth: 72, fontSize: 11 }}>{p.code}</span>
                  <span style={{ color: "#1B2B4B", fontWeight: 500 }}>{p.displayName}</span>
                </button>
              );
            })}
          </div>
        )}

        {catId && products.length === 0 && (
          <p style={{ fontSize: 13, color: "#888", marginTop: 4, marginBottom: 0 }}>
            No products found in this selection.
          </p>
        )}
      </div>

      <p style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>
        Tick up to 3 products. First ticked = first shown on the product page.
      </p>
    </div>
  );
}

export { ProductComplementaryPicker };
export default ProductComplementaryPicker;
