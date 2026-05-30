"use client";

/**
 * /cart — Shopping cart page.
 *
 * Reads items from localStorage (`dazzlez_cart`), fetches live prices for
 * each item via /api/pdp/[code], and lets the customer adjust qty or remove
 * items before proceeding to checkout.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

type CartItem = {
  code:        string;
  displayName: string;
  metal:       string;
  goldColor:   string;
  tier:        string;
  size:        string;
  carat:       string;
  engraving:   string;
  qty:         number;
  timestamp:   number;
};

type LivePrice = {
  loading: boolean;
  totalInr?: number;
  error?: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatInr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("dazzlez_cart") || "[]") as CartItem[];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem("dazzlez_cart", JSON.stringify(items));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const [items,  setItems]  = useState<CartItem[]>([]);
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setMounted(true);
    setItems(getCart());
  }, []);

  // Fetch live price for each unique (code × metal × tier × size × carat) combo
  useEffect(() => {
    if (!mounted) return;
    items.forEach((item) => {
      const key = `${item.code}|${item.metal}|${item.tier}|${item.size}|${item.carat}`;
      if (prices[key]) return; // already fetched
      setPrices((p) => ({ ...p, [key]: { loading: true } }));
      const params = new URLSearchParams({ metal: item.metal, diamond: item.tier });
      if (item.size)  params.set("size",  item.size);
      if (item.carat) params.set("carat", item.carat);
      fetch(`/api/pdp/${item.code}?${params.toString()}`)
        .then((r) => r.json())
        .then((d) => {
          // API returns prices for all 3 tiers; pick the one matching item.tier
          const tier = item.tier === "natural" ? "natural" : item.tier === "lab-premium" ? "labPremium" : "labStandard";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const totalInr = (d?.prices as any)?.[tier]?.total ?? d?.total;
          setPrices((p) => ({
            ...p,
            [key]: { loading: false, totalInr: typeof totalInr === "number" ? totalInr : undefined },
          }));
        })
        .catch(() => {
          setPrices((p) => ({ ...p, [key]: { loading: false, error: true } }));
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, items]);

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    saveCart(next);
  };

  const changeQty = (index: number, delta: number) => {
    const next = items.map((item, i) => {
      if (i !== index) return item;
      return { ...item, qty: Math.max(1, item.qty + delta) };
    });
    setItems(next);
    saveCart(next);
  };

  const getPrice = (item: CartItem): LivePrice => {
    const key = `${item.code}|${item.metal}|${item.tier}|${item.size}|${item.carat}`;
    return prices[key] ?? { loading: true };
  };

  // Total (sum of unit × qty, where unit is already inclusive of GST)
  const grandTotal = items.reduce((sum, item) => {
    const p = getPrice(item);
    return sum + (p.totalInr ?? 0) * item.qty;
  }, 0);

  const anyLoading = items.some((item) => getPrice(item).loading);

  if (!mounted) return null;

  if (!items.length) {
    return (
      <div className="bg-cream min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="font-display text-3xl text-navy mb-2">Your cart is empty</h1>
        <p className="text-muted text-sm mb-8">
          Browse our collections or use the Design Advisor to find your perfect piece.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/collections/rings"
            className="bg-gold text-navy font-medium px-8 py-3 rounded-full hover:bg-gold/90 transition-colors text-sm">
            Browse Rings
          </Link>
          <Link href="/design"
            className="border border-navy/20 text-navy font-medium px-8 py-3 rounded-full hover:border-gold hover:text-gold transition-colors text-sm">
            Design Advisor ✦
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl text-navy mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* ── Item list ── */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, i) => {
              const p = getPrice(item);
              return (
                <div key={`${item.code}-${item.timestamp}-${i}`}
                  className="bg-white border border-cream-200 rounded-2xl p-5 flex gap-4 shadow-sm">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-navy text-sm leading-snug">{item.displayName}</p>
                    <p className="text-xs text-muted mt-1 uppercase tracking-wide">{item.code}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted">
                      {item.metal    && <span>Metal: {item.metal}</span>}
                      {item.tier     && <span>Diamond: {item.tier}</span>}
                      {item.size     && <span>Size: {item.size}</span>}
                      {item.carat    && <span>Carat: {item.carat}ct</span>}
                      {item.goldColor && <span>Colour: {item.goldColor}</span>}
                      {item.engraving && <span>Engraving: &ldquo;{item.engraving}&rdquo;</span>}
                    </div>
                    {/* Qty controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <button type="button" onClick={() => changeQty(i, -1)}
                        className="w-7 h-7 border border-navy/15 rounded-full text-sm text-navy hover:border-gold hover:text-gold transition-colors flex items-center justify-center">
                        −
                      </button>
                      <span className="text-sm text-navy font-medium w-4 text-center">{item.qty}</span>
                      <button type="button" onClick={() => changeQty(i, 1)}
                        className="w-7 h-7 border border-navy/15 rounded-full text-sm text-navy hover:border-gold hover:text-gold transition-colors flex items-center justify-center">
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price + remove */}
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <div className="text-right">
                      {p.loading ? (
                        <div className="h-5 w-20 bg-navy/10 rounded animate-pulse" />
                      ) : p.error ? (
                        <span className="text-xs text-muted">–</span>
                      ) : (
                        <>
                          <p className="font-semibold text-navy text-sm">{formatInr(p.totalInr! * item.qty)}</p>
                          {item.qty > 1 && (
                            <p className="text-xs text-muted">{formatInr(p.totalInr!)} each</p>
                          )}
                        </>
                      )}
                    </div>
                    <button type="button" onClick={() => removeItem(i)}
                      className="text-xs text-muted hover:text-red-500 transition-colors mt-3">
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {/* WhatsApp escape hatch */}
            <p className="text-xs text-muted text-center pt-2">
              Prefer to order over WhatsApp?{" "}
              <a
                href={`https://wa.me/919829115205?text=${encodeURIComponent(
                  "Hi The Dazzlez! I'd like to place an order. Cart:\n" +
                  items.map((it) => `• ${it.displayName} (${it.code}) — ${it.metal}, ${it.tier}`).join("\n")
                )}`}
                target="_blank" rel="noopener noreferrer"
                className="text-gold underline underline-offset-2 hover:no-underline">
                Chat with us →
              </a>
            </p>
          </div>

          {/* ── Order summary ── */}
          <div className="lg:col-span-1 bg-white border border-cream-200 rounded-2xl p-6 shadow-sm sticky top-24">
            <h2 className="font-display text-lg text-navy mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between text-muted">
                <span>Subtotal (incl. 3% GST)</span>
                {anyLoading
                  ? <div className="h-4 w-16 bg-navy/10 rounded animate-pulse" />
                  : <span className="text-navy font-medium">{formatInr(grandTotal)}</span>}
              </div>
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span className="text-navy">Calculated at checkout</span>
              </div>
              <div className="pt-3 border-t border-cream-200 flex justify-between font-semibold text-navy">
                <span>Total</span>
                {anyLoading
                  ? <div className="h-5 w-20 bg-navy/10 rounded animate-pulse" />
                  : <span>{formatInr(grandTotal)}</span>}
              </div>
            </div>

            <p className="text-xs text-muted mb-5 leading-relaxed">
              Prices include 3% GST. Made-to-order pieces are crafted in 15–21 days.
            </p>

            <button
              type="button"
              disabled={anyLoading || grandTotal === 0}
              onClick={() => router.push("/checkout")}
              className="w-full bg-gold text-navy font-medium py-3.5 rounded-full hover:bg-gold/90 transition-colors disabled:opacity-50 text-sm">
              Proceed to Checkout →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
