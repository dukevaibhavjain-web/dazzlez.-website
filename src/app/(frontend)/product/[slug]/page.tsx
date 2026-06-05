import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import {
  getProductBySlug,
  getSimilarProducts,
  getMetalOptions,
} from "@/lib/storefront/catalog";
import { ProductConfigurator } from "@/components/storefront/ProductConfigurator";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ReviewsSection, type ReviewDoc } from "@/components/storefront/ReviewsSection";
import { TryAtHomeCard, type TryAtHomeSettings } from "@/components/storefront/TryAtHomeCard";
import { FAQSection, type FAQItem } from "@/components/storefront/FAQSection";
import {
  MatchAndShine,
  type ComplementaryProduct,
} from "@/components/storefront/MatchAndShine";
import { StickyPDPBar } from "@/components/storefront/StickyPDPBar";
import { Breadcrumb } from "@/components/storefront/Breadcrumb";
import { buildReviewSchema } from "@/lib/seo/schemas";
import type { GalleryImage, GoldColor } from "@/components/storefront/ProductGallery";

// Cache the static shell for 5 min (ISR). Live prices are fetched client-side
// by the buy-box, so caching the page doesn't stale the pricing.
export const revalidate = 300;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thedazzlez.com";

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
    alternates: {
      canonical: `${BASE_URL}/product/${slug}`,
    },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const product = (await getProductBySlug(slug)) as any;
  if (!product) notFound();

  // Hero image: color-agnostic (shown for all variants as fallback).
  const images: GalleryImage[] = [];
  const heroU = imgUrl(product.heroImage);
  if (heroU) images.push({ url: heroU, alt: product.displayName, goldColor: "" });

  // Per-color hero images (if set by admin): take priority over the generic hero for their respective variants.
  const heroYellow = imgUrl(product.heroImageYellow);
  if (heroYellow) images.push({ url: heroYellow, alt: product.displayName, goldColor: "yellow" });

  const heroWhite = imgUrl(product.heroImageWhite);
  if (heroWhite) images.push({ url: heroWhite, alt: product.displayName, goldColor: "white" });

  const heroRose = imgUrl(product.heroImageRose);
  if (heroRose) images.push({ url: heroRose, alt: product.displayName, goldColor: "rose" });

  // Gallery: carry through the goldColor tag set by admin in Image Manager.
  for (const g of product.gallery ?? []) {
    const u = imgUrl(g.image);
    if (u) {
      images.push({
        url: u,
        alt: product.displayName,
        goldColor: (g.goldColor ?? "") as GoldColor,
      });
    }
  }

  // Default gold color from admin (yellow for gold, white for silver/platinum).
  const defaultGoldColor: GoldColor = (product.defaultGoldColor ?? "yellow") as GoldColor;

  const categoryId =
    typeof product.category === "object" ? product.category?.id : product.category;
  const similar = categoryId ? await getSimilarProducts(categoryId, product.id, 4) : [];
  const metalOptions = getMetalOptions(product);

  const payload = await getPayload({ config });

  // ── Complementary products (bidirectional) ─────────────────────────────
  // Forward: products explicitly linked on THIS product's Match & Shine tab.
  const forwardRaw: any[] = (product.complementaryProducts as any[]) ?? [];
  const forwardItems: ComplementaryProduct[] = forwardRaw
    .filter((p: any) => p && typeof p === "object" && p.slug)
    .map((p: any) => ({
      slug: p.slug,
      displayName: p.displayName ?? "",
      heroUrl: imgUrl(p.heroImage, "zoom"),
      fromPriceInr: p.fromPriceInr ?? null,
    }));

  // Reverse: products that have THIS product in their complementaryProducts.
  // This makes pairings bidirectional without double-writing data.
  const reverseResult = await payload.find({
    collection: "products",
    where: { complementaryProducts: { equals: product.id } },
    depth: 2,
    limit: 10,
  });
  const forwardSlugs = new Set(forwardItems.map((p) => p.slug));
  const reverseItems: ComplementaryProduct[] = (reverseResult.docs as any[])
    .filter((p: any) => p.slug && p.slug !== product.slug && !forwardSlugs.has(p.slug))
    .map((p: any) => ({
      slug: p.slug,
      displayName: p.displayName ?? "",
      heroUrl: imgUrl(p.heroImage, "zoom"),
      fromPriceInr: p.fromPriceInr ?? null,
    }));

  // Merge: forward first (intentional order), then reverse fills remaining slots.
  const recommendations: ComplementaryProduct[] = [
    ...forwardItems,
    ...reverseItems,
  ].slice(0, 3);

  // Fetch trust badges (site-wide, cached via ISR)
  const trustResult = await payload.find({
    collection: "trust-badges",
    where: { active: { equals: true } },
    sort: "order",
    limit: 10,
    depth: 0,
  });
  const trustBadges = trustResult.docs.map((b) => ({
    id: b.id,
    icon: (b as unknown as { icon: string }).icon,
    label: (b as unknown as { label: string }).label,
    tooltip: (b as unknown as { tooltip?: string }).tooltip ?? null,
  }));

  // Fetch Try at Home global settings
  const tahRaw = (await payload.findGlobal({ slug: "try-at-home-settings" })) as any;
  const tryAtHomeSettings: TryAtHomeSettings | null = tahRaw?.enabled
    ? {
        title: tahRaw.title || "Try at Home",
        description: tahRaw.description || "",
        buttonText: tahRaw.buttonText || "Request a Home Trial",
        imageUrl: imgUrl(tahRaw.image, "zoom"),
        disclaimer: tahRaw.disclaimer ?? null,
      }
    : null;

  // Fetch approved reviews for this product
  const reviewsResult = await payload.find({
    collection: "reviews",
    where: {
      and: [
        { product: { equals: product.id } },
        { approved: { equals: true } },
      ],
    },
    limit: 50,
    sort: "-reviewDate",
    depth: 0,
  });
  const reviews = reviewsResult.docs as unknown as ReviewDoc[];
  const totalReviews = reviewsResult.totalDocs;
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  // Fetch active FAQs (site-wide, same for all products)
  const faqsResult = await payload.find({
    collection: "faqs",
    where: { active: { equals: true } },
    sort: "order",
    limit: 30,
    depth: 0,
  });
  const faqs: FAQItem[] = faqsResult.docs.map((f) => ({
    id: f.id,
    question: (f as unknown as { question: string }).question,
    answer: (f as unknown as { answer: string }).answer,
  }));

  const shapeName = (d: any) =>
    typeof d?.shape === "object" ? d.shape?.name : null;

  // ── Product JSON-LD schema ──────────────────────────────────────────────
  const heroImageUrl = imgUrl(product.heroImage, "zoom");
  const productUrl = `${BASE_URL}/product/${product.slug}`;

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type":    "Product",
    name:        product.displayName,
    description: product.description ?? `${product.displayName} — certified diamond jewellery by Dazzlez.`,
    brand: { "@type": "Brand", name: "The Dazzlez" },
    url:   productUrl,
    sku:   product.code,
    ...(heroImageUrl ? { image: [heroImageUrl] } : {}),
    offers: {
      "@type":          "Offer",
      priceCurrency:    "INR",
      price:            product.fromPriceInr ?? 0,
      availability:     "https://schema.org/InStock",
      url:              productUrl,
      seller:           { "@type": "Organization", name: "The Dazzlez" },
    },
    ...(avgRating > 0 && totalReviews > 0
      ? {
          aggregateRating: {
            "@type":       "AggregateRating",
            ratingValue:   avgRating,
            reviewCount:   totalReviews,
            bestRating:    5,
            worstRating:   1,
          },
        }
      : {}),
  };

  // Build breadcrumb items
  const categoryObj = typeof product.category === "object" ? product.category : null;
  const categorySlug = categoryObj?.slug ?? "products";
  const categoryName = categoryObj?.name ?? "Products";

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: categoryName, href: `/collections/${categorySlug}` },
    { name: product.displayName, href: `/product/${product.slug}` },
  ];

  // Build review schema if reviews exist
  const reviewSchemas = reviews.length > 0
    ? buildReviewSchema(
        reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          authorName: r.authorName,
          title: r.title,
          body: r.body,
          reviewDate: r.reviewDate,
        })),
        {
          displayName: product.displayName,
          url: productUrl,
          heroImageUrl,
          sku: product.code,
          fromPriceInr: product.fromPriceInr ?? null,
          avgRating,
          totalReviews,
        }
      )
    : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* Individual Review schema objects — only if reviews exist */}
      {reviewSchemas.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(reviewSchemas),
          }}
        />
      )}

      {/* Breadcrumb navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Sticky bar — slides in from top once user scrolls past the buy box */}
      <StickyPDPBar
        displayName={product.displayName}
        code={product.code}
        heroUrl={imgUrl(product.heroImage, "card")}
        fromPriceInr={product.fromPriceInr ?? null}
        avgRating={avgRating}
        totalReviews={totalReviews}
      />

    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Gallery + Buy box — wrapped in ProductConfigurator to share goldColor state */}
      <ProductConfigurator
        images={images}
        code={product.code}
        displayName={product.displayName}
        metalOptions={metalOptions}
        isSolitaire={!!product.isSolitaire}
        isRing={!!product.isRing}
        initialMetal={sp.metal}
        initialTier={sp.diamond}
        defaultGoldColor={defaultGoldColor}
        avgRating={avgRating}
        totalReviews={totalReviews}
        trustBadges={trustBadges}
      />

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
            Made to Order &amp; Shipping
          </summary>
          <p className="mt-3 text-sm text-ink/80 leading-relaxed">
            Most pieces are crafted to order in approximately 10–14 days. You&apos;ll receive a
            video of your finished piece before dispatch. Insured shipping, 30-day returns, and a
            lifetime buyback &amp; exchange on all jewellery.
          </p>
        </details>
      </div>

      {/* Match & Shine — complementary products (bidirectional) */}
      <MatchAndShine recommendations={recommendations} />

      {/* Try at Home — lead-gen card (shown only when enabled in admin) */}
      {tryAtHomeSettings && (
        <div className="mt-12 max-w-3xl">
          <TryAtHomeCard
            settings={tryAtHomeSettings}
            productCode={product.code}
            productName={product.displayName}
          />
        </div>
      )}

      {/* Reviews */}
      <ReviewsSection reviews={reviews} avgRating={avgRating} />

      {/* FAQs */}
      <FAQSection faqs={faqs} />

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
    </>
  );
}
