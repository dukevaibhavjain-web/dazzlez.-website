/**
 * Breadcrumb Component
 *
 * Server Component that renders visible breadcrumb navigation and injects BreadcrumbList schema.
 * Used on product pages, category pages, and collection pages.
 */

import Link from "next/link";
import { BreadcrumbItem, buildBreadcrumbSchema } from "@/lib/seo/schemas";

type Props = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: Props) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thedazzlez.com";
  const breadcrumbSchema = buildBreadcrumbSchema(items, baseUrl);

  return (
    <>
      {/* Visible breadcrumb navigation */}
      <nav aria-label="breadcrumb" className="px-4 sm:px-6 py-2 max-w-7xl mx-auto">
        <ol className="flex items-center gap-1.5 text-sm flex-wrap">
          {items.map((item, i) => (
            <li key={item.href} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-muted" aria-hidden>
                  ›
                </span>
              )}
              {i < items.length - 1 ? (
                <Link
                  href={item.href}
                  className="text-muted hover:text-gold transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="text-ink font-medium">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* BreadcrumbList schema — structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  );
}
