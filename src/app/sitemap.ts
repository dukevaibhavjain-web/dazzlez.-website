import type { MetadataRoute } from "next";
import { getPayload } from "payload";
import config from "@payload-config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thedazzlez.com";

/**
 * Dynamic sitemap — generated at build time (ISR every 24 h).
 * Includes static marketing pages + all active product PDPs.
 */
export const revalidate = 86400; // 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                          lastModified: new Date(), priority: 1.0,  changeFrequency: "weekly" },
    { url: `${BASE_URL}/design`,              lastModified: new Date(), priority: 0.9,  changeFrequency: "monthly" },
    { url: `${BASE_URL}/collections/rings`,   lastModified: new Date(), priority: 0.85, changeFrequency: "daily" },
    { url: `${BASE_URL}/collections/necklaces`, lastModified: new Date(), priority: 0.8, changeFrequency: "daily" },
    { url: `${BASE_URL}/collections/earrings`,  lastModified: new Date(), priority: 0.8, changeFrequency: "daily" },
    { url: `${BASE_URL}/collections/bracelets`, lastModified: new Date(), priority: 0.8, changeFrequency: "daily" },
    { url: `${BASE_URL}/cart`,                lastModified: new Date(), priority: 0.3,  changeFrequency: "never" },
  ];

  // ── Dynamic product pages ────────────────────────────────────────────────
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const payload = await getPayload({ config });
    const res = await payload.find({
      collection: "products",
      where:  { status: { equals: "active" } },
      select: { slug: true, updatedAt: true } as never,
      limit:  1000,
      depth:  0,
    });

    productPages = res.docs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((p: any) => p.slug)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => ({
        url:             `${BASE_URL}/product/${p.slug}`,
        lastModified:    p.updatedAt ? new Date(p.updatedAt) : new Date(),
        priority:        0.8,
        changeFrequency: "weekly" as const,
      }));
  } catch (err) {
    console.error("[sitemap] Failed to fetch products:", err);
  }

  return [...staticPages, ...productPages];
}
