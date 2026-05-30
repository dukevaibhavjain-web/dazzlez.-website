"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { FilterOption } from "@/lib/storefront/catalog";

type Props = {
  shapes: FilterOption[];
  styles: FilterOption[];
  metals: FilterOption[];
};

const PRICE_BANDS = [
  { label: "Under ₹50k", min: 0, max: 50000 },
  { label: "₹50k–₹1L", min: 50000, max: 100000 },
  { label: "₹1L–₹2L", min: 100000, max: 200000 },
  { label: "₹2L–₹5L", min: 200000, max: 500000 },
  { label: "₹5L+", min: 500000, max: undefined },
];

export function FilterBar({ shapes, styles, metals }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const push = useCallback(
    (next: URLSearchParams) => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname],
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      next.delete("page"); // reset pagination on filter change
      if (value == null || next.get(key) === value) next.delete(key);
      else next.set(key, value);
      push(next);
    },
    [params, push],
  );

  const setPriceBand = useCallback(
    (min: number, max: number | undefined) => {
      const next = new URLSearchParams(params.toString());
      next.delete("page");
      if (next.get("min") === String(min)) {
        next.delete("min");
        next.delete("max");
      } else {
        next.set("min", String(min));
        if (max != null) next.set("max", String(max));
        else next.delete("max");
      }
      push(next);
    },
    [params, push],
  );

  const toggleCsv = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      next.delete("page");
      const current = (next.get(key) ?? "").split(",").filter(Boolean);
      const idx = current.indexOf(value);
      if (idx >= 0) current.splice(idx, 1);
      else current.push(value);
      if (current.length) next.set(key, current.join(","));
      else next.delete(key);
      push(next);
    },
    [params, push],
  );

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const get = (key: string) => params.get(key);
  const csvHas = (key: string, val: string) =>
    (params.get(key) ?? "").split(",").filter(Boolean).includes(val);

  // Count active filter groups (for the mobile badge)
  const activeCount = [
    !!get("shape"),
    !!(params.get("metal") ?? "").length,
    !!get("style"),
    !!get("min"),
    get("inStock") === "1",
  ].filter(Boolean).length;

  const hasFilters = activeCount > 0;

  // ── Shared sub-components ──────────────────────────────────────────────────
  const Chip = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
        active
          ? "bg-navy text-cream border-navy"
          : "bg-white text-ink border-cream-200 hover:border-gold"
      }`}
    >
      {children}
    </button>
  );

  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <h4 className="eyebrow mb-2.5">{title}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );

  // ── Filter content (shared between drawer and desktop sidebar) ─────────────
  const filterContent = (
    <>
      <Group title="Sort">
        <select
          value={get("sort") ?? "featured"}
          onChange={(e) => setParam("sort", e.target.value === "featured" ? null : e.target.value)}
          className="w-full border border-cream-200 rounded px-2 py-1.5 text-sm bg-white"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </Group>

      <Group title="Price">
        {PRICE_BANDS.map((b) => (
          <Chip
            key={b.label}
            active={get("min") === String(b.min)}
            onClick={() => setPriceBand(b.min, b.max)}
          >
            {b.label}
          </Chip>
        ))}
      </Group>

      {shapes.length > 0 && (
        <Group title="Diamond Shape">
          {shapes.map((s) => (
            <Chip
              key={s.value}
              active={get("shape") === s.value}
              onClick={() => setParam("shape", s.value)}
            >
              {s.label}
            </Chip>
          ))}
        </Group>
      )}

      <Group title="Metal">
        {metals.map((m) => (
          <Chip
            key={m.value}
            active={csvHas("metal", m.value)}
            onClick={() => toggleCsv("metal", m.value)}
          >
            {m.label}
          </Chip>
        ))}
      </Group>

      {styles.length > 0 && (
        <Group title="Style">
          {styles.map((s) => (
            <Chip
              key={s.value}
              active={get("style") === s.value}
              onClick={() => setParam("style", s.value)}
            >
              {s.label}
            </Chip>
          ))}
        </Group>
      )}

      <Group title="Availability">
        <Chip
          active={get("inStock") === "1"}
          onClick={() => setParam("inStock", get("inStock") === "1" ? null : "1")}
        >
          Ready to Ship
        </Chip>
      </Group>
    </>
  );

  return (
    <>
      {/* ── Mobile trigger row ─────────────────────────────────────────────── */}
      <div className="md:hidden flex items-center gap-2 mb-5">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 border border-cream-200 rounded-full text-sm font-medium bg-white hover:border-gold transition-colors"
        >
          {/* filter icon */}
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5 text-navy"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z"
              clipRule="evenodd"
            />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-navy text-cream text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </button>

        {/* Mobile compact sort */}
        <select
          value={get("sort") ?? "featured"}
          onChange={(e) => setParam("sort", e.target.value === "featured" ? null : e.target.value)}
          className="flex-1 border border-cream-200 rounded-full px-3 py-2 text-xs bg-white"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-gold hover:underline whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-2xl max-h-[82vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200 shrink-0">
              <h3 className="font-display text-lg text-navy">Filters</h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-muted hover:text-navy text-xl leading-none"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto px-5 py-4 flex-1">{filterContent}</div>

            {/* Footer */}
            <div className="shrink-0 border-t border-cream-200 px-5 py-4 flex gap-3">
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    clearAll();
                    setDrawerOpen(false);
                  }}
                  className="flex-1 py-2.5 border border-cream-200 rounded text-sm font-medium hover:border-gold transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex-1 py-2.5 bg-navy text-cream rounded text-sm font-semibold hover:bg-navy/90 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ────────────────────────────────────────────────── */}
      <aside className="hidden md:block md:w-60 md:shrink-0 sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl text-navy">Filters</h3>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-gold hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        {filterContent}
      </aside>
    </>
  );
}
