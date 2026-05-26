"use client";

/**
 * ActiveFilterChips — strip of removable tags shown above the product grid
 * whenever any filter is active. Each chip removes its filter on click.
 * Returns null when no filters are applied.
 */

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { FilterOption } from "@/lib/storefront/catalog";

const METAL_LABELS: Record<string, string> = {
  "9K": "9K Gold",
  "14K": "14K Gold",
  "18K": "18K Gold",
  "22K": "22K Gold",
  Silver925: "Silver 925",
  Platinum: "Platinum",
};

const PRICE_LABELS: Record<string, string> = {
  "0": "Under ₹50k",
  "50000": "₹50k – ₹1L",
  "100000": "₹1L – ₹2L",
  "200000": "₹2L – ₹5L",
  "500000": "₹5L+",
};

type Props = {
  shapes: FilterOption[];
  styles: FilterOption[];
};

export function ActiveFilterChips({ shapes, styles }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Helpers to produce next URLSearchParams
  const without = (keys: string[]) => {
    const next = new URLSearchParams(params.toString());
    keys.forEach((k) => next.delete(k));
    next.delete("page");
    return next;
  };
  const removeCsv = (key: string, val: string) => {
    const next = new URLSearchParams(params.toString());
    const current = (next.get(key) ?? "").split(",").filter((v) => v && v !== val);
    if (current.length) next.set(key, current.join(","));
    else next.delete(key);
    next.delete("page");
    return next;
  };

  const push = (next: URLSearchParams) =>
    router.push(`${pathname}?${next.toString()}`, { scroll: false });

  // Build chip list
  type Chip = { id: string; label: string; onRemove: () => void };
  const chips: Chip[] = [];

  // Shape
  const shapeVal = params.get("shape");
  if (shapeVal) {
    const label = shapes.find((s) => s.value === shapeVal)?.label ?? shapeVal;
    chips.push({
      id: "shape",
      label: `Shape: ${label}`,
      onRemove: () => push(without(["shape"])),
    });
  }

  // Metals (multi-select CSV)
  const metalCsv = params.get("metal");
  if (metalCsv) {
    metalCsv.split(",").filter(Boolean).forEach((m) => {
      chips.push({
        id: `metal-${m}`,
        label: METAL_LABELS[m] ?? m,
        onRemove: () => push(removeCsv("metal", m)),
      });
    });
  }

  // Style
  const styleVal = params.get("style");
  if (styleVal) {
    const label = styles.find((s) => s.value === styleVal)?.label ?? styleVal;
    chips.push({
      id: "style",
      label: `Style: ${label}`,
      onRemove: () => push(without(["style"])),
    });
  }

  // Price band
  const minVal = params.get("min");
  if (minVal) {
    chips.push({
      id: "price",
      label: PRICE_LABELS[minVal] ?? `₹${Number(minVal).toLocaleString("en-IN")}+`,
      onRemove: () => push(without(["min", "max"])),
    });
  }

  // In stock
  if (params.get("inStock") === "1") {
    chips.push({
      id: "inStock",
      label: "Ready to Ship",
      onRemove: () => push(without(["inStock"])),
    });
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.onRemove}
          className="flex items-center gap-1 px-3 py-1 rounded-full border border-navy/20 bg-navy/5 text-navy text-xs font-medium hover:bg-navy/10 transition-colors"
        >
          {chip.label}
          <span className="ml-0.5 text-sm leading-none opacity-60">×</span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => router.push(pathname, { scroll: false })}
        className="text-xs text-gold hover:underline px-1"
      >
        Clear all
      </button>
    </div>
  );
}
