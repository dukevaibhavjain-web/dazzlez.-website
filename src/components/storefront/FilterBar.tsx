"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
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

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value == null || next.get(key) === value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      // reset price band keys together
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const setPriceBand = useCallback(
    (min: number, max: number | undefined) => {
      const next = new URLSearchParams(params.toString());
      const active = next.get("min") === String(min);
      if (active) {
        next.delete("min");
        next.delete("max");
      } else {
        next.set("min", String(min));
        if (max != null) next.set("max", String(max));
        else next.delete("max");
      }
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  // Multi-select toggle for a CSV param (e.g. metal=9K,14K)
  const toggleCsv = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      const current = (next.get(key) ?? "").split(",").filter(Boolean);
      const idx = current.indexOf(value);
      if (idx >= 0) current.splice(idx, 1);
      else current.push(value);
      if (current.length) next.set(key, current.join(","));
      else next.delete(key);
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const clearAll = () => router.push(pathname, { scroll: false });

  const current = (key: string) => params.get(key);
  const csvHas = (key: string, value: string) =>
    (params.get(key) ?? "").split(",").filter(Boolean).includes(value);
  const hasFilters = ["shape", "metal", "style", "min", "inStock"].some((k) => params.get(k));

  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <h4 className="eyebrow mb-2.5">{title}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );

  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
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

  return (
    <aside className="md:w-60 md:shrink-0">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xl text-navy">Filters</h3>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-gold hover:underline">
            Clear all
          </button>
        )}
      </div>

      <Group title="Sort">
        <select
          value={current("sort") ?? "featured"}
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
            active={current("min") === String(b.min)}
            onClick={() => setPriceBand(b.min, b.max)}
          >
            {b.label}
          </Chip>
        ))}
      </Group>

      {shapes.length > 0 && (
        <Group title="Diamond Shape">
          {shapes.map((s) => (
            <Chip key={s.value} active={current("shape") === s.value} onClick={() => setParam("shape", s.value)}>
              {s.label}
            </Chip>
          ))}
        </Group>
      )}

      <Group title="Metal">
        {metals.map((m) => (
          <Chip key={m.value} active={csvHas("metal", m.value)} onClick={() => toggleCsv("metal", m.value)}>
            {m.label}
          </Chip>
        ))}
      </Group>

      {styles.length > 0 && (
        <Group title="Style">
          {styles.map((s) => (
            <Chip key={s.value} active={current("style") === s.value} onClick={() => setParam("style", s.value)}>
              {s.label}
            </Chip>
          ))}
        </Group>
      )}

      <Group title="Availability">
        <Chip active={current("inStock") === "1"} onClick={() => setParam("inStock", "1")}>
          Ready to Ship
        </Chip>
      </Group>
    </aside>
  );
}
