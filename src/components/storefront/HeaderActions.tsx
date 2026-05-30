"use client";

/**
 * HeaderActions — client-side interactive header elements.
 *
 * Renders:
 *  - Search icon → opens full-width search modal
 *  - Cart icon with live badge count (reads localStorage)
 *  - Account link
 *
 * Kept as a separate "use client" component so the parent Header
 * can remain a Server Component.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SearchResult = {
  id: string;
  slug: string;
  code: string;
  displayName: string;
  fromPriceInr?: number | null;
  categoryName?: string;
};

function formatInr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

// ── Cart badge ────────────────────────────────────────────────────────────────

function useCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function refresh() {
      try {
        const cart = JSON.parse(localStorage.getItem("dazzlez_cart") || "[]") as { qty: number }[];
        setCount(cart.reduce((s, i) => s + (i.qty || 1), 0));
      } catch {
        setCount(0);
      }
    }
    refresh();
    // Poll every 2 s to catch add-to-cart events from other tabs / same page without a full reload
    const id = setInterval(refresh, 2000);
    window.addEventListener("storage", refresh);
    return () => {
      clearInterval(id);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return count;
}

// ── Search modal ──────────────────────────────────────────────────────────────

function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SearchResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const router    = useRouter();

  // Focus input on open
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Debounced search
  const doSearch = useCallback((q: string) => {
    clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json() as { results: SearchResult[] };
        setResults(data.results ?? []);
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    doSearch(v);
  };

  const goToProduct = (slug: string) => {
    onClose();
    router.push(`/product/${slug}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-x-0 top-0 z-50 bg-white shadow-2xl rounded-b-2xl max-h-[85vh] flex flex-col">
        {/* Search bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-cream-200">
          <svg className="w-5 h-5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleChange}
            placeholder="Search rings, necklaces, earrings…"
            className="flex-1 text-navy text-base outline-none placeholder:text-muted bg-transparent"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-navy transition-colors text-sm shrink-0">
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {results.length > 0 && (
            <ul className="divide-y divide-cream-200">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => goToProduct(r.slug)}
                    className="w-full text-left px-5 py-3.5 hover:bg-cream transition-colors flex justify-between items-center gap-3">
                    <div>
                      <p className="font-medium text-navy text-sm">{r.displayName}</p>
                      <p className="text-xs text-muted mt-0.5 uppercase tracking-wide">{r.code}</p>
                    </div>
                    {r.fromPriceInr != null && (
                      <span className="text-xs text-muted shrink-0">from {formatInr(r.fromPriceInr)}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {searched && results.length === 0 && query.trim() && (
            <div className="px-5 py-10 text-center text-muted text-sm">
              No products found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!query.trim() && (
            <div className="px-5 py-6 text-center text-muted text-sm">
              Try searching for &ldquo;diamond ring&rdquo;, &ldquo;gold earring&rdquo;, or a product code.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function HeaderActions() {
  const cartCount = useCartCount();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-5 text-sm flex-1">
        {/* Search */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Search products"
          className="hover:text-gold transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Account */}
        <Link href="/account" className="hover:text-gold transition-colors hidden sm:block">
          Account
        </Link>

        {/* Cart with badge */}
        <Link href="/cart" className="relative hover:text-gold transition-colors" aria-label="Shopping cart">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[1.1rem] h-[1.1rem] bg-gold text-navy text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </Link>
      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
