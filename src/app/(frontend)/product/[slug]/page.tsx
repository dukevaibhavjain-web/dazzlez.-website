import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProductBySlug,
  getSimilarProducts,
  getMetalOptions,
} from "@/lib/storefront/catalog";
import { ProductGallery, type GalleryImage } from "@/components/storefront/ProductGallery";
import { ProductBuyBox } from "@/components/storefront/ProductBuyBox";
import { ProductCard } from "@/components/storefront/ProductCard";

// Cache the static shell for 5 min (ISR). Live prices are fetched client-side
// by the buy-box, so caching the page doesn't stale the pricing.
export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ metal?: string; diamond?: string }>;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function imgUrl(media: any, size: "zoom" | "card" = "zoom"): string | null {
  if (!media || typeof media !== "object") return null;
  return media?.sizes?.[size]?.url ?? media?.url ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getProductBySlug(slug)) as any;
  if (!p) return { title: "Product" };
  return {
    title: p.displayName,
    description: p.description || `${p.displayName} — certified diamond jewellery by Dazzlez.`,
    openGraph: { images: imgUrl(p.heroImage, "zoom") ? [imgUrl(p.heroImage, "zoom")!] : [] },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const product = (await getProductBySlug(slug)) as any;
  if (!product) notFound();

  const images: GalleryImage[] = [];
  const heroU = imgUrl(product.heroImage);
  if (heroU) images.push({ url: heroU, alt: product.displayName });
  for (const g of product.gallery ?? []) {
    const u = imgUrl(g.image);
    if (u) images.push({ url: u, alt: product.displayName });
  }

  const categoryId =
    typeof product.category === "object" ? product.category?.id : product.category;
  const similar = categoryId ? await getSimilarProducts(categoryId, product.id, 4) : [];
  const metalOptions = getMetalOptions(product);

  const shapeName = (d: any) =>
    typeof d?.shape === "object" ? d.shape?.name : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Gallery + Buy box */}
      <div className="grid lg:grid-cols-2 gap-10">
        <ProductGallery images={images} />
        <ProductBuyBox
          code={product.code}
          displayName={product.displayName}
          metalOptions={metalOptions}
          isSolitaire={!!product.isSolitaire}
          isRing={!!product.isRing}
          initialMetal={sp.metal}
          initialTier={sp.diamond}
        />
      </div>

      {/* Detail accordions */}
      <div className="mt-12 max-w-3xl space-y-3">
        {product.description && (
          <details open className="border border-cream-200 rounded-lg p-4">
            <summary className="font-display text-lg text-navy cursor-pointer">Description</summary>
            <p className="mt-3 text-sm text-ink/80 leading-relaxed">{product.description}</p>
          </details>
        )}

        <details className="border border-cream-200 rounded-lg p-4">
          <summary className="font-display text-lg text-navy cursor-pointer">Specifications</summary>
          <div className="mt-3 text-sm text-ink/80 space-y-3">
            {product.diamonds?.length > 0 && (
              <div>
                <p className="font-medium text-ink mb-1">Diamonds</p>
                <ul className="space-y-1">
                  {product.diamonds.map((d: any, i: number) => (
                    <li key={i}>
                      {d.role === "solitaire" ? "Solitaire" : "Small"} —{" "}
                      {shapeName(d) ? `${shapeName(d)}, ` : ""}
                      {d.count}pc, {d.weightCt}ct total
                      {d.sizeMm ? `, ${d.sizeMm}mm` : ""}
                      {d.color || d.clarity ? ` (${[d.color, d.clarity].filter(Boolean).join("/")})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {product.metals?.length > 0 && (
              <div>
                <p className="font-medium text-ink mb-1">Metal Weights</p>
                <ul className="space-y-1">
                  {product.metals.map((m: any, i: number) => (
                    <li key={i}>{m.purity}: {m.weightG}g</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>

        <details className="border border-cream-200 rounded-lg p-4">
          <summary className="font-display text-lg text-navy cursor-pointer">Certificates</summary>
          <p className="mt-3 text-sm text-ink/80 leading-relaxed">
            Every Dazzlez piece is BIS-hallmarked. Solitaires are IGI / GIA certified with full
            4Cs disclosure. Certificate accompanies your order.
          </p>
        </details>

        <details className="border border-cream-200 rounded-lg p-4">
          <summary className="font-display text-lg text-navy cursor-pointer">
            Made to Order & Shipping
          </summary>
          <p className="mt-3 text-sm text-ink/80 leading-relaxed">
            Most pieces are crafted to order in approximately 10–14 days. You&apos;ll receive a
            video of your finished piece before dispatch. Insured shipping, 30-day returns, and a
            lifetime buyback &amp; exchange on all jewellery.
          </p>
        </details>
      </div>

      {/* Similar products */}
      {similar.length > 0 && (
        <div className="mt-16">
          <div className="text-center mb-8">
            <p className="eyebrow">You May Also Like</p>
            <h2 className="font-display text-3xl text-navy mt-1">Similar Products</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
