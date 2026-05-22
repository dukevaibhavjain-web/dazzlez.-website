"use client";

/**
 * StickyPDPBar — slides in from the top once the user scrolls past the buy box.
 * Always rendered in the DOM (never conditionally mounted) so the slide-out
 * animation plays smooth in both directions.
 *
 * "Add to Cart" fires a CustomEvent that ProductBuyBox listens to, so the cart
 * entry carries the user's currently selected metal/tier/size instead of defaults.
 */

import { useEffect, useState, useCallback } from "react";

// Intentionally NOT imported from catalog.ts — that module pulls in Payload
// (server-only) and would break the client bundle. Duplicate the tiny formatter here.
function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const WA_NUMBER = "919829115205";
const SCROLL_THRESHOLD = 420;

// ── SVG icons (no icon library needed) ────────────────────────────────────
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.11 1.522 5.834L.057 23.48a.5.5 0 0 0 .606.61l5.788-1.488A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.9 9.9 0 0 1-5.031-1.371l-.36-.214-3.735.96.992-3.63-.235-.375A9.9 9.9 0 0 1 2.1 12C2.1 6.534 6.534 2.1 12 2.1c5.465 0 9.9 4.434 9.9 9.9 0 5.465-4.435 9.9-9.9 9.9z" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────
type Props = {
  displayName: string;
  code: string;
  heroUrl: string | null;
  fromPriceInr: number | null;
  avgRating?: number;
  totalReviews?: number;
};

export function StickyPDPBar({
  displayName,
  code,
  heroUrl,
  fromPriceInr,
  avgRating,
  totalReviews,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [cartFeedback, setCartFeedback] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // run once in case page is pre-scrolled
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fires a CustomEvent that ProductBuyBox listens for.
  // The buy box handles the actual localStorage write with its selected state.
  const handleAddToCart = useCallback(() => {
    window.dispatchEvent(new CustomEvent("dazzlez:add-to-cart"));
    setCartFeedback(true);
    setTimeout(() => setCartFeedback(false), 2000);
  }, []);

  const waMsg = encodeURIComponent(
    `Hi, I'm interested in the ${displayName} (${code}). Could you help me?`,
  );
  const waHref = `https://wa.me/${WA_NUMBER}?text=${waMsg}`;

  return (
    <div
      aria-hidden={!visible}
      className={[
        "fixed top-0 left-0 right-0 z-50",
        "bg-white border-b border-cream-200 shadow-sm",
        "transition-transform duration-300 ease-out",
        visible ? "translate-y-0" : "-translate-y-full",
      ].join(" ")}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-[60px] flex items-center gap-3 sm:gap-4">

        {/* Thumbnail */}
        {heroUrl && (
          <div className="shrink-0 w-10 h-10 rounded-md overflow-hidden border border-cream-200 hidden sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroUrl} alt={displayName} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Name + rating */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy text-sm leading-tight truncate">
            {displayName}
          </p>
          {avgRating != null && totalReviews != null && totalReviews > 0 && (
            <p className="text-[11px] text-muted leading-tight mt-0.5">
              <span className="text-gold">★</span>{" "}
              {avgRating.toFixed(1)} · {totalReviews} review{totalReviews !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Price */}
        {fromPriceInr != null && (
          <p className="hidden md:block text-sm font-semibold text-navy shrink-0 whitespace-nowrap">
            from {formatInr(fromPriceInr)}
          </p>
        )}

        {/* ── CTAs ─────────────────────────────────────────────────────── */}
        {/* WhatsApp — mobile: icon only · sm+: "Continue on" + icon */}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1.5 border border-[#25D366] text-[#25D366] text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-full hover:bg-[#25D366] hover:text-white transition-colors whitespace-nowrap"
        >
          {/* mobile: icon only */}
          <WhatsAppIcon className="w-5 h-5 shrink-0 sm:hidden" />
          {/* sm+: text + icon */}
          <span className="hidden sm:inline">Continue on</span>
          <WhatsAppIcon className="hidden sm:block w-4 h-4 shrink-0" />
        </a>

        {/* Add to Cart */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="shrink-0 flex items-center gap-1.5 bg-navy text-cream text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-full hover:bg-navy/90 transition-colors whitespace-nowrap"
        >
          <span>{cartFeedback ? "Added ✓" : "Add to"}</span>
          {!cartFeedback && <CartIcon className="w-4 h-4 shrink-0" />}
        </button>

      </div>
    </div>
  );
}
