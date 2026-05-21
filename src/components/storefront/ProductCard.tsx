import Link from "next/link";
import type { ProductCardData } from "@/lib/storefront/catalog";
import { formatInr } from "@/lib/storefront/catalog";

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block bg-white rounded-lg overflow-hidden border border-cream-200 hover:shadow-lg transition-shadow"
    >
      <div className="aspect-square bg-cream-200 overflow-hidden relative">
        {product.heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.heroUrl}
            alt={product.heroAlt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm">
            No image
          </div>
        )}
        {product.fulfillmentType === "ready_stock" && (
          <span className="absolute top-2 left-2 bg-gold text-navy text-[10px] font-semibold px-2 py-0.5 rounded">
            IN STOCK
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-ink line-clamp-1">{product.displayName}</h3>
        <p className="text-xs text-muted mt-0.5">{product.code}</p>
        {product.fromPriceInr != null ? (
          <p className="mt-1.5 text-sm">
            <span className="text-muted text-xs">from </span>
            <span className="font-semibold text-navy">{formatInr(product.fromPriceInr)}</span>
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-muted">Request a quote</p>
        )}
      </div>
    </Link>
  );
}
