/**
 * Pagination — URL-based prev / next + page numbers.
 * Rendered server-side; uses Next.js <Link> for prefetching.
 * Returns null when there is only one page.
 */

import Link from "next/link";

type Props = {
  page: number;
  total: number;
  pageSize: number;
  basePath: string; // e.g. "/collections/rings"
  /** Current search params — page key is stripped and replaced */
  searchParams: Record<string, string | string[] | undefined>;
};

function buildUrl(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  page: number,
) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (k === "page") continue;
    const val = Array.isArray(v) ? v[0] : v;
    if (val) sp.set(k, val);
  }
  if (page > 1) sp.set("page", String(page));
  const q = sp.toString();
  return q ? `${basePath}?${q}` : basePath;
}

export function Pagination({ page, total, pageSize, basePath, searchParams }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  // Build visible page list with ellipsis markers
  const visible: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      visible.push(i);
    } else if (visible[visible.length - 1] !== "…") {
      visible.push("…");
    }
  }

  const linkCls = (active: boolean) =>
    `flex items-center justify-center min-w-[2.25rem] h-9 px-3 rounded border text-sm transition-colors ${
      active
        ? "bg-navy text-cream border-navy font-semibold"
        : "bg-white text-ink border-cream-200 hover:border-gold"
    }`;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1.5 mt-12 flex-wrap"
    >
      {/* Prev */}
      {page > 1 ? (
        <Link href={buildUrl(basePath, searchParams, page - 1)} className={linkCls(false)}>
          ← Prev
        </Link>
      ) : (
        <span className={`${linkCls(false)} opacity-40 cursor-default`}>← Prev</span>
      )}

      {/* Page numbers */}
      {visible.map((v, i) =>
        v === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-muted text-sm select-none">
            …
          </span>
        ) : (
          <Link
            key={v}
            href={buildUrl(basePath, searchParams, v)}
            className={linkCls(v === page)}
            aria-current={v === page ? "page" : undefined}
          >
            {v}
          </Link>
        ),
      )}

      {/* Next */}
      {page < totalPages ? (
        <Link href={buildUrl(basePath, searchParams, page + 1)} className={linkCls(false)}>
          Next →
        </Link>
      ) : (
        <span className={`${linkCls(false)} opacity-40 cursor-default`}>Next →</span>
      )}
    </nav>
  );
}
