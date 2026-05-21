"use client";

/**
 * Live price preview rendered on the Product edit page (sidebar).
 *
 * Reads the saved product (via Payload's document ID), lets admin switch
 * Metal × Diamond × Solitaire-carat right in the panel, and shows the full
 * computed breakup inline. No new tabs, no JSON popups.
 *
 * Phase 0 limitation: it reads SAVED state. Edit a weight or rate, hit Save,
 * and the preview will refetch. A Phase 1B follow-up will read transient
 * form state via useAllFormFields so the preview updates live before save.
 */
import { useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { useCallback, useEffect, useState } from "react";

type LineItem = { label: string; detail?: string; amountInr: number };
type Breakup = {
  total: number;
  subTotal: number;
  gst: number;
  lineItems: LineItem[];
};
type Fulfillment = {
  type: "made_to_order" | "ready_stock";
  stockQuantity: number;
  disclaimer: string;
  badge: string | null;
  quoteValidityDays: number;
};

const METAL_OPTIONS = [
  { value: "9K", label: "9K Gold" },
  { value: "14K", label: "14K Gold" },
  { value: "18K", label: "18K Gold" },
  { value: "22K", label: "22K Gold" },
  { value: "Silver925", label: "Silver 925" },
  { value: "Platinum", label: "Platinum" },
] as const;

const DIAMOND_OPTIONS = [
  { value: "natural", label: "Natural" },
  { value: "lab-premium", label: "Lab Grown Premium" },
  { value: "lab-standard", label: "Lab Grown Standard" },
] as const;

const CARAT_OPTIONS = [
  { value: "", label: "Recipe default" },
  { value: "1", label: "1.00 ct" },
  { value: "2", label: "2.00 ct" },
  { value: "3", label: "3.00 ct" },
] as const;

const box: React.CSSProperties = {
  padding: 14,
  background: "var(--theme-elevation-50, #f5f5f5)",
  border: "1px solid var(--theme-elevation-150, #ddd)",
  borderRadius: 4,
  marginTop: 8,
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  color: "var(--theme-elevation-500, #666)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 10,
};
const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "var(--theme-elevation-500, #666)",
  marginBottom: 3,
};
const select: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 4,
  border: "1px solid var(--theme-elevation-200, #ccc)",
  fontSize: 13,
  background: "var(--theme-input-bg, #fff)",
};
const total: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 600,
  lineHeight: 1.1,
  marginTop: 4,
  marginBottom: 6,
};
const note: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 13,
  color: "var(--theme-elevation-500, #666)",
};
const errorBox: React.CSSProperties = {
  padding: 10,
  fontSize: 13,
  color: "var(--theme-error-500, #c00)",
  background: "var(--theme-error-50, #fee)",
  borderRadius: 4,
  marginTop: 6,
};

const ProductPricePreview = () => {
  // Guard against SSR/CSR mismatch: render a stable shell on first paint,
  // then swap to live content after mount. Payload hooks like
  // useDocumentInfo and useFormFields can return different values during
  // SSR vs hydration which produces a React hydration warning.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { id } = useDocumentInfo();
  // Payload updates updatedAt on every save — watching it auto-refreshes the
  // preview without the user having to click Refresh.
  const updatedAt = useFormFields(([fields]) => fields?.updatedAt?.value as string | undefined);
  const [code, setCode] = useState<string | null>(null);
  const [metal, setMetal] = useState<string>("18K");
  const [diamond, setDiamond] = useState<string>("natural");
  const [carat, setCarat] = useState<string>("");
  const [breakup, setBreakup] = useState<Breakup | null>(null);
  const [fulfillment, setFulfillment] = useState<Fulfillment | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Resolve product code from id (admin URL has id, /api/quote needs code).
  // Re-fetches after each save in case the code changed.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setCode(d?.code ?? null);
      })
      .catch(() => {
        if (!cancelled) setCode(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id, updatedAt]);

  const refetch = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams({ metal, diamond });
      if (carat) params.set("carat", carat);
      const r = await fetch(`/api/quote/${code}?${params.toString()}`);
      const d = await r.json();
      if (d.ok) {
        setBreakup(d.breakup);
        setFulfillment(d.fulfillment ?? null);
      } else {
        setErr(d.error ?? "Failed to compute price");
        setBreakup(null);
        setFulfillment(null);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBreakup(null);
    } finally {
      setLoading(false);
    }
  }, [code, metal, diamond, carat]);

  // Refetch on mount, selector change, AND every save (updatedAt changes).
  useEffect(() => {
    refetch();
  }, [refetch, updatedAt]);

  // Match initial server-render output until client takes over — prevents
  // React hydration mismatch warning.
  if (!mounted) {
    return <div style={note}>Loading preview…</div>;
  }
  if (!id) {
    return <div style={note}>Save the product to see price preview.</div>;
  }

  return (
    <div style={box}>
      <div style={sectionLabel}>Price Preview</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <label style={fieldLabel}>Metal</label>
          <select
            value={metal}
            onChange={(e) => setMetal(e.target.value)}
            style={select}
          >
            {METAL_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={fieldLabel}>Diamond</label>
          <select
            value={diamond}
            onChange={(e) => setDiamond(e.target.value)}
            style={select}
          >
            {DIAMOND_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={fieldLabel}>Solitaire Carat</label>
          <select
            value={carat}
            onChange={(e) => setCarat(e.target.value)}
            style={select}
          >
            {CARAT_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--theme-elevation-150, #ddd)" }}>
        {loading && <div style={{ fontSize: 13, color: "var(--theme-elevation-500)" }}>Loading…</div>}
        {err && !loading && <div style={errorBox}>{err}</div>}
        {breakup && !loading && (
          <>
            {fulfillment?.badge && (
              <div
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  fontSize: 11,
                  background: "var(--theme-success-100, #e6f4e6)",
                  color: "var(--theme-success-700, #1b5e20)",
                  borderRadius: 3,
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                {fulfillment.badge}
                {fulfillment.stockQuantity > 0 && ` (${fulfillment.stockQuantity})`}
              </div>
            )}
            <div style={total}>
              {fulfillment?.type === "made_to_order" && (
                <span style={{ fontSize: 13, color: "var(--theme-elevation-500, #666)", fontWeight: 400, marginRight: 4 }}>
                  Estimated:
                </span>
              )}
              ₹{breakup.total.toLocaleString("en-IN")}
            </div>
            {fulfillment?.disclaimer && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--theme-elevation-500, #666)",
                  fontStyle: "italic",
                  lineHeight: 1.4,
                  marginBottom: 8,
                  padding: 8,
                  background: "var(--theme-elevation-100, #f0f0f0)",
                  borderRadius: 3,
                  borderLeft: "3px solid var(--theme-elevation-300, #ccc)",
                }}
              >
                {fulfillment.disclaimer}
              </div>
            )}
            <details style={{ fontSize: 13 }}>
              <summary
                style={{
                  cursor: "pointer",
                  color: "var(--theme-text, #0066cc)",
                  userSelect: "none",
                }}
              >
                See breakup
              </summary>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {breakup.lineItems.map((li, i) => (
                  <li key={i} style={{ margin: "5px 0" }}>
                    <strong>{li.label}:</strong>{" "}
                    ₹{li.amountInr.toLocaleString("en-IN")}
                    {li.detail && (
                      <div
                        style={{
                          color: "var(--theme-elevation-500, #888)",
                          fontSize: 12,
                        }}
                      >
                        {li.detail}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={refetch}
        style={{
          marginTop: 10,
          padding: "5px 10px",
          fontSize: 12,
          background: "transparent",
          border: "1px solid var(--theme-elevation-200, #ccc)",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Refresh
      </button>
    </div>
  );
};

export default ProductPricePreview;
