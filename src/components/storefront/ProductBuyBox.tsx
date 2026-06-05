"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import type { GoldColor } from "@/components/storefront/ProductGallery";
import { ReviewBadge } from "@/components/storefront/ReviewBadge";
import { trackViewContent, trackAddToCart } from "@/lib/analytics/track";

const WA_NUMBER = "919829115205";

/** Metals that have gold color variants (Yellow / White / Rose). */
const GOLD_PURITIES = new Set(["9K", "14K", "18K", "22K"]);

type MetalOption = { value: string; label: string };
type TrustBadgeItem = { id: number | string; icon: string; label: string; tooltip?: string | null };
type TierKey = "natural" | "lab-premium" | "lab-standard";
type LineItem = { label: string; detail?: string; amountInr: number };
type Variant = { total: number; lineItems: LineItem[] } | { error: string };
type PdpResponse = {
  ok: boolean;
  variants: Record<TierKey, Variant>;
  fulfillment: { type: "made_to_order" | "ready_stock"; disclaimer: string; badge: string | null; stockQuantity: number };
};

const TIER_LABEL: Record<TierKey, string> = {
  natural: "Natural",
  "lab-premium": "Lab Grown Premium",
  "lab-standard": "Lab Grown Standard",
};

const RING_SIZES = Array.from({ length: 19 }, (_, i) => (4 + i * 0.5).toString());
const CARATS = [
  { value: "", label: "As designed" },
  { value: "1", label: "1.00 ct" },
  { value: "2", label: "2.00 ct" },
  { value: "3", label: "3.00 ct" },
];

const GOLD_COLORS: Array<{ value: GoldColor; label: string; swatch: string }> = [
  { value: "yellow", label: "Yellow Gold", swatch: "#E8C44D" },
  { value: "white",  label: "White Gold",  swatch: "#D0D0D0" },
  { value: "rose",   label: "Rose Gold",   swatch: "#D4927A" },
];

/** Hardcoded fallback shown if no trust badges have been seeded yet. */
const FALLBACK_BADGES: TrustBadgeItem[] = [
  { id: "fb-1", icon: "✦", label: "BIS Hallmarked", tooltip: null },
  { id: "fb-2", icon: "✦", label: "IGI / GIA Certified", tooltip: null },
  { id: "fb-3", icon: "✦", label: "Lifetime Buyback & Exchange", tooltip: null },
  { id: "fb-4", icon: "✦", label: "Insured Shipping & 30-day Returns", tooltip: null },
];

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

const TIER_KEYS: TierKey[] = ["natural", "lab-premium", "lab-standard"];

export function ProductBuyBox({
  code,
  displayName,
  metalOptions,
  isSolitaire,
  isRing,
  initialMetal,
  initialTier,
  defaultGoldColor = "yellow",
  onGoldColorChange,
  avgRating,
  totalReviews,
  trustBadges,
}: {
  code: string;
  displayName: string;
  metalOptions: MetalOption[];
  isSolitaire: boolean;
  isRing: boolean;
  initialMetal?: string;
  initialTier?: string;
  /** Default color pre-selected for this product (from admin field). */
  defaultGoldColor?: GoldColor;
  /** Notifies parent (ProductConfigurator) when gold color changes. */
  onGoldColorChange?: (color: GoldColor) => void;
  avgRating?: number;
  totalReviews?: number;
  trustBadges?: TrustBadgeItem[];
}) {
  // Default metal: the one we arrived with (from a card), else the cheapest
  // available metal (matches the collection "from" price), else first option.
  const metalIsValid = initialMetal && metalOptions.some((m) => m.value === initialMetal);
  const defaultMetal =
    (metalIsValid ? initialMetal : undefined) ?? metalOptions[0]?.value ?? "18K";
  // Default tier: arrived tier if valid, else lab-standard (the "from" basis,
  // so the headline matches the collection card).
  const defaultTier: TierKey = (TIER_KEYS as string[]).includes(initialTier ?? "")
    ? (initialTier as TierKey)
    : "lab-standard";

  const [metal, setMetal] = useState(defaultMetal);
  const [tier, setTier] = useState<TierKey>(defaultTier);
  const [size, setSize] = useState("");
  const [carat, setCarat] = useState("");
  const [engraving, setEngraving] = useState("");
  const [goldColor, setGoldColorState] = useState<GoldColor>(defaultGoldColor);
  const [data, setData] = useState<PdpResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  // Is the currently selected metal a gold purity? (shows color picker)
  const isGoldMetal = GOLD_PURITIES.has(metal);

  // When metal switches away from gold, revert to white (silver/platinum
  // use white-gold images). When switching back to gold, restore default.
  useEffect(() => {
    const next: GoldColor = isGoldMetal ? defaultGoldColor : "white";
    setGoldColorState(next);
    onGoldColorChange?.(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metal]);

  const setGoldColor = useCallback(
    (c: GoldColor) => {
      setGoldColorState(c);
      onGoldColorChange?.(c);
    },
    [onGoldColorChange],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ metal });
    if (carat) params.set("carat", carat);
    if (size) params.set("size", size);
    fetch(`/api/pdp/${code}?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code, metal, carat, size]);

  const selectedTotal = useMemo(() => {
    const v = data?.variants?.[tier];
    return v && "total" in v ? v.total : null;
  }, [data, tier]);

  const naturalTotal = useMemo(() => {
    const v = data?.variants?.natural;
    return v && "total" in v ? v.total : null;
  }, [data]);

  const waLink = useMemo(() => {
    const metalLabel = metalOptions.find((m) => m.value === metal)?.label ?? metal;
    const colorLabel = isGoldMetal
      ? GOLD_COLORS.find((c) => c.value === goldColor)?.label ?? ""
      : "";
    const parts = [
      `Hi Dazzlez, I'm interested in ${displayName} (${code}).`,
      `Metal: ${metalLabel}${colorLabel ? ` — ${colorLabel}` : ""}`,
      `Diamond: ${TIER_LABEL[tier]}`,
      size ? `Ring size: ${size}` : "",
      carat ? `Solitaire: ${carat}ct` : "",
      engraving ? `Engraving: "${engraving}"` : "",
      selectedTotal ? `Estimated: ${inr(selectedTotal)}` : "",
      "Can you help me with this?",
    ].filter(Boolean);
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(parts.join("\n"))}`;
  }, [code, displayName, metal, metalOptions, tier, size, carat, engraving, selectedTotal, goldColor, isGoldMetal]);

  const addToCart = useCallback(() => {
    try {
      const cart = JSON.parse(localStorage.getItem("dazzlez_cart") ?? "[]");
      cart.push({ code, displayName, metal, goldColor, tier, size, carat, engraving, qty: 1, addedAt: Date.now() });
      localStorage.setItem("dazzlez_cart", JSON.stringify(cart));
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);

      // Track AddToCart event
      if (selectedTotal && selectedTotal > 0) {
        trackAddToCart(code, metal, selectedTotal, 1);
      }
    } catch {
      /* ignore */
    }
  }, [code, displayName, metal, goldColor, tier, size, carat, engraving, selectedTotal]);

  // Listen for the sticky bar's "Add to Cart" button — it fires this event
  // so the buy box can handle the actual cart write with current selections.
  useEffect(() => {
    const handler = () => addToCart();
    window.addEventListener("dazzlez:add-to-cart", handler);
    return () => window.removeEventListener("dazzlez:add-to-cart", handler);
  }, [addToCart]);

  // Track ViewContent event on mount
  useEffect(() => {
    if (code && displayName) {
      trackViewContent(code, displayName, selectedTotal || 0);
    }
  }, [code, displayName]); // Only fire once on mount

  const savingsVsNatural = (t: number) =>
    naturalTotal && naturalTotal > 0 ? Math.round((1 - t / naturalTotal) * 100) : 0;

  return (
    <div>
      {avgRating != null && totalReviews != null && totalReviews > 0 && (
        <ReviewBadge avgRating={avgRating} totalReviews={totalReviews} />
      )}
      <h1 className="font-display text-3xl text-navy">{displayName}</h1>
      <p className="text-xs text-muted mt-0.5 tracking-wide">{code}</p>

      {/* Price */}
      <div className="mt-4">
        {loading ? (
          <div className="h-9 w-40 bg-cream-200 rounded animate-pulse" />
        ) : selectedTotal != null ? (
          <div className="flex items-baseline gap-2">
            {data?.fulfillment.type === "made_to_order" && (
              <span className="text-sm text-muted">Estimated</span>
            )}
            <span className="text-3xl font-semibold text-navy">{inr(selectedTotal)}</span>
            {data?.fulfillment.badge && (
              <span className="bg-gold text-navy text-[10px] font-semibold px-2 py-0.5 rounded">
                {data.fulfillment.badge}
              </span>
            )}
          </div>
        ) : (
          <p className="text-muted">Request a quote</p>
        )}
        {data?.fulfillment.disclaimer && (
          <p className="text-[11px] text-muted italic mt-1.5 leading-relaxed">
            {data.fulfillment.disclaimer}
          </p>
        )}
      </div>

      {/* Metal selector */}
      <div className="mt-6">
        <p className="eyebrow mb-2">Metal</p>
        <div className="flex flex-wrap gap-2">
          {metalOptions.map((m) => (
            <button
              key={m.value}
              onClick={() => setMetal(m.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
                metal === m.value ? "bg-navy text-cream border-navy" : "bg-white border-cream-200 hover:border-gold"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gold color selector — only for gold purities */}
      {isGoldMetal && (
        <div className="mt-4">
          <p className="eyebrow mb-2">Gold Colour</p>
          <div className="flex gap-3">
            {GOLD_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setGoldColor(c.value)}
                title={c.label}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  goldColor === c.value
                    ? "border-navy bg-navy/5 text-navy font-medium"
                    : "border-cream-200 hover:border-gold/60 text-ink"
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full inline-block shrink-0 border border-black/10"
                  style={{ background: c.swatch }}
                />
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Silver / Platinum plating note */}
      {!isGoldMetal && (
        <p className="mt-3 text-[11px] text-muted italic leading-relaxed">
          Want a specific plating colour (yellow / rose tone)? Mention it in the engraving field below or on WhatsApp — our team will confirm.
        </p>
      )}

      {/* Natural vs Lab — the transparency widget */}
      <div className="mt-6">
        <p className="eyebrow mb-2">Diamond — compare &amp; choose</p>
        <div className="grid grid-cols-3 gap-2">
          {(["natural", "lab-premium", "lab-standard"] as TierKey[]).map((t) => {
            const v = data?.variants?.[t];
            const total = v && "total" in v ? v.total : null;
            const save = total ? savingsVsNatural(total) : 0;
            return (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  tier === t ? "border-gold bg-gold/5" : "border-cream-200 hover:border-gold/50"
                }`}
              >
                <div className="text-xs font-medium text-ink">{TIER_LABEL[t]}</div>
                <div className="text-sm font-semibold text-navy mt-1">
                  {total != null ? inr(total) : "—"}
                </div>
                {t !== "natural" && save > 0 && (
                  <div className="text-[10px] text-emerald-700 mt-0.5">save {save}%</div>
                )}
              </button>
            );
          })}
        </div>
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-2 text-xs text-gold hover:underline"
        >
          Want this in natural diamond, better-priced? Talk to a designer →
        </a>
      </div>

      {/* Price Breakup — collapsible, only shown when a price is available */}
      {selectedTotal != null && (() => {
        const v = data?.variants?.[tier];
        const items: LineItem[] = (v && "lineItems" in v) ? v.lineItems : [];
        if (items.length === 0) return null;
        return (
          <details className="mt-4 group border border-cream-200 rounded-lg overflow-hidden">
            <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm font-medium text-ink bg-cream-100/50 hover:bg-cream-100 transition-colors list-none">
              <span>Price Breakup</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted font-normal">incl. GST</span>
                <span className="text-gold font-semibold">{inr(selectedTotal)}</span>
                <span className="text-muted text-xs group-open:rotate-180 transition-transform">▾</span>
              </span>
            </summary>
            <div className="px-4 pb-4 pt-3 space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <div className="text-ink/80">
                    {item.label}
                    {item.detail && (
                      <span className="text-muted ml-1">({item.detail})</span>
                    )}
                  </div>
                  <span className="font-medium text-ink shrink-0 ml-4 tabular-nums">{inr(item.amountInr)}</span>
                </div>
              ))}
              <div className="border-t border-cream-200 pt-2.5 mt-1 flex justify-between text-xs font-semibold text-ink">
                <span>Total (incl. 3% GST)</span>
                <span className="tabular-nums">{inr(selectedTotal)}</span>
              </div>
              <p className="text-[10px] text-muted leading-relaxed pt-0.5">
                Rates are live and may change slightly by the time of invoicing.
              </p>
            </div>
          </details>
        );
      })()}

      {/* Ring size */}
      {isRing && (
        <div className="mt-6">
          <p className="eyebrow mb-2">Ring Size (US)</p>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="border border-cream-200 rounded px-3 py-2 text-sm bg-white"
          >
            <option value="">Select size</option>
            {RING_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {/* Solitaire carat */}
      {isSolitaire && (
        <div className="mt-6">
          <p className="eyebrow mb-2">Solitaire Size</p>
          <div className="flex flex-wrap gap-2">
            {CARATS.map((c) => (
              <button
                key={c.value}
                onClick={() => setCarat(c.value)}
                className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
                  carat === c.value ? "bg-navy text-cream border-navy" : "bg-white border-cream-200 hover:border-gold"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Engraving */}
      <div className="mt-6">
        <p className="eyebrow mb-2">Engraving (optional)</p>
        <input
          type="text"
          maxLength={20}
          value={engraving}
          onChange={(e) => setEngraving(e.target.value)}
          placeholder="Up to 20 characters"
          className="w-full border border-cream-200 rounded px-3 py-2 text-sm bg-white"
        />
      </div>

      {/* CTAs */}
      <div className="mt-7 flex flex-col gap-3">
        <button
          onClick={addToCart}
          className="w-full bg-navy text-cream py-3 rounded-full font-medium hover:bg-navy-700 transition-colors"
        >
          {added ? "Added to cart ✓" : "Add to Cart"}
        </button>
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="w-full border border-navy text-navy py-3 rounded-full font-medium text-center hover:bg-navy hover:text-cream transition-colors"
        >
          Continue on WhatsApp
        </a>
      </div>

      {/* Trust badges */}
      {(trustBadges ?? FALLBACK_BADGES).length > 0 && (
        <div className="mt-7 grid grid-cols-2 gap-3 text-xs text-muted border-t border-cream-200 pt-5">
          {(trustBadges ?? FALLBACK_BADGES).map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-1.5"
              title={b.tooltip ?? undefined}
            >
              <span className="text-gold shrink-0">{b.icon}</span>
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
