"use client";

/**
 * /wishlist — Customer wishlist.
 *
 * Persisted in localStorage as `dazzlez_wishlist` — a JSON array of product slugs.
 * No auth required; syncs to server on login (future Phase 6).
 *
 * Each card fetches its live price via /api/pdp/[code].
 * The wishlist stores the minimal info needed to render cards without a fetch:
 *   { slug, code, displayName, heroUrl, fromPriceInr }
 */

import { useState, useEffect } from "react";
import Link from "next/link";

type WishlistItem = {
  slug:         string;
  code:         string;
  displayName:  string;
  heroUrl?:     string | null;
  fromPriceInr?: number | null;
};

function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("dazzlez_wishlist") || "[]") as WishlistItem[];
  } catch {
    return [];
  }
}

function saveWishlist(items: WishlistItem[]) {
  localStorage.setItem("dazzlez_wishlist", JSON.stringify(items));
}

export function removeFromWishlist(slug: string) {
  const next = getWishlist().filter((i) => i.slug !== slug);
  saveWishlist(next);
  return next;
}

export function addToWishlist(item: WishlistItem) {
  const current = getWishlist();
  if (current.some((i) => i.slug === item.slug)) return current;
  const next = [...current, item];
  saveWishlist(next);
  return next;
}

export function isWishlisted(slug: string): boolean {
  return getWishlist().some((i) => i.slug === slug);
}

function formatInr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

// ── Wishlist heart button (used on ProductCard/PDP) ───────────────────────────

export function WishlistButton({
  item,
  className = "",
}: {
  item: WishlistItem;
  className?: string;
}) {
  const [wishlisted, setWishlisted] = useState(false);
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => {
    setMounted(true);
    setWishlisted(isWishlisted(item.slug));
  }, [item.slug]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlisted) {
      removeFromWishlist(item.slug);
      setWishlisted(false);
    } else {
      addToWishlist(item);
      setWishlisted(true);
    }
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`p-2 rounded-full transition-colors ${wishlisted ? "text-red-500" : "text-navy/40 hover:text-red-400"} ${className}`}>
      <svg className="w-5 h-5" viewBox="0 0 24 24"
        fill={wishlisted ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WishlistPage() {
  const [items,   setItems]   = useState<WishlistItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setItems(getWishlist());
  }, []);

  const remove = (slug: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.slug !== slug);
      saveWishlist(next);
      return next;
    });
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="bg-cream min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-5xl mb-4">🤍</p>
        <h1 className="font-display text-3xl text-navy mb-2">Your wishlist is empty</h1>
        <p className="text-muted text-sm mb-8">
          Heart a piece you love and it&apos;ll appear here — no login required.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/collections/rings"
            className="bg-gold text-navy font-medium px-8 py-3 rounded-full text-sm hover:bg-gold/90 transition-colors">
            Browse Rings
          </Link>
          <Link href="/design"
            className="border border-navy/20 text-navy font-medium px-8 py-3 rounded-full text-sm hover:border-gold hover:text-gold transition-colors">
            Design Advisor ✦
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl text-navy mb-8">
          Your Wishlist
          <span className="text-muted text-base font-sans font-normal ml-3">({items.length} {items.length === 1 ? "piece" : "pieces"})</span>
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => (
            <div key={item.slug} className="group relative">
              <Link href={`/product/${item.slug}`}
                className="block bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="aspect-square bg-cream overflow-hidden">
                  {item.heroUrl ? (
                    <img
                      src={item.heroUrl}
                      alt={item.displayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted text-4xl">💍</div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-medium text-navy text-sm leading-snug line-clamp-2">{item.displayName}</p>
                  <p className="text-xs text-muted mt-0.5">{item.code}</p>
                  {item.fromPriceInr != null && (
                    <p className="text-sm text-navy font-semibold mt-1">from {formatInr(item.fromPriceInr)}</p>
                  )}
                </div>
              </Link>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => remove(item.slug)}
                aria-label="Remove from wishlist"
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white text-red-400 hover:text-red-600 shadow-sm transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Share wishlist CTA */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/wishlist?items=${items.map((i) => i.slug).join(",")}`;
              navigator.clipboard.writeText(url).then(() => alert("Wishlist link copied to clipboard!")).catch(() => {});
            }}
            className="text-sm text-muted hover:text-navy transition-colors underline underline-offset-2">
            Share my wishlist →
          </button>
        </div>
      </div>
    </div>
  );
}
