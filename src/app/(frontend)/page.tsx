import type React from "react";
import { getHomePage, getShapes } from "@/lib/storefront/catalog";
import { HeroSliderSection } from "@/components/storefront/home/HeroSliderSection";
import { CategoryGridSection } from "@/components/storefront/home/CategoryGridSection";
import { ImageBannerSection } from "@/components/storefront/home/ImageBannerSection";
import { ShapeGridSection } from "@/components/storefront/home/ShapeGridSection";
import { PromiseStripSection } from "@/components/storefront/home/PromiseStripSection";
import { FeaturedProductsSection } from "@/components/storefront/home/FeaturedProductsSection";
import { CustomizationChatSection } from "@/components/storefront/home/CustomizationChatSection";
import { NewsletterSection } from "@/components/storefront/home/NewsletterSection";

// ISR: cache the page shell for 5 minutes (live prices are fetched client-side on PDP)
export const revalidate = 300;

// ── Default sections shown when CMS has no data yet ─────────────────────────
// Mirrors the previous hardcoded homepage so the page is never blank.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEFAULT_SECTIONS: any[] = [
  {
    blockType: "hero-banner",
    heading: "Celebrate your moments with jewellery as personal as they are.",
    subheading:
      "Lab-grown & natural diamonds. 100% transparent pricing. Certified, BIS-hallmarked, and crafted to order — or pick from ready stock.",
    backgroundColor: "navy",
    primaryCtaText: "Shop Rings",
    primaryCtaLink: "/collections/rings",
    secondaryCtaText: "Explore Collection",
    secondaryCtaLink: "/collections/earrings",
    splitMode: "split-chat",
  },
  {
    blockType: "category-grid",
    eyebrow: "Shop By",
    title: "Category",
    items: [
      { category: { slug: "rings", name: "Rings" }, imageUrl: null },
      { category: { slug: "earrings", name: "Earrings" }, imageUrl: null },
      { category: { slug: "necklaces", name: "Necklaces" }, imageUrl: null },
      { category: { slug: "bracelets", name: "Bracelets" }, imageUrl: null },
    ],
  },
  {
    blockType: "shape-grid",
    eyebrow: "Shop By",
    title: "Shape",
    backgroundColor: "cream",
    linkToCategory: "/collections/rings",
  },
  {
    blockType: "promise-strip",
    backgroundColor: "white",
    items: [
      {
        icon: "✦",
        title: "100% Transparent Pricing",
        description:
          "See exactly what you pay — metal, diamonds, making. Compare natural vs lab-grown side by side.",
      },
      {
        icon: "✦",
        title: "Certified & Hallmarked",
        description:
          "Every piece is BIS-hallmarked with certified solitaires. Full stone disclosure, always.",
      },
      {
        icon: "✦",
        title: "Made for You",
        description:
          "Most pieces are crafted to order. Talk to a designer on WhatsApp to personalise yours.",
      },
    ],
  },
  {
    blockType: "customization-chat",
    heading: "Find Your Perfect Piece",
    subheading: "Tell us what you're looking for — our AI advisor will help you find it.",
    placeholderText: "E.g. 'A rose gold ring for my anniversary under ₹1 lakh'",
    ctaLabel: "Start Designing",
    whatsappNumber: "+919829115205",
  },
];

// ── Block renderer map ───────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BLOCK_MAP: Record<string, React.ComponentType<any>> = {
  // hero-slider is the virtual grouped type — individual hero-banner blocks are
  // merged into it before rendering (see groupHeroBanners below)
  "hero-slider": HeroSliderSection,
  "category-grid": CategoryGridSection,
  "image-banner": ImageBannerSection,
  "shape-grid": ShapeGridSection,
  "promise-strip": PromiseStripSection,
  "featured-products": FeaturedProductsSection,
  "customization-chat": CustomizationChatSection,
};

/**
 * Collapse runs of consecutive `hero-banner` blocks into a single
 * `{ blockType: "hero-slider", slides: [...] }` entry so they render
 * as a carousel instead of stacking.  A lone hero-banner becomes a
 * slider with one slide (no arrows/dots rendered).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupHeroBanners(sections: any[]): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any[] = [];
  let i = 0;
  while (i < sections.length) {
    if (sections[i].blockType === "hero-banner") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const slides: any[] = [];
      while (i < sections.length && sections[i].blockType === "hero-banner") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { blockType: _bt, id: _id, ...slideProps } = sections[i] as any;
        slides.push(slideProps);
        i++;
      }
      out.push({ blockType: "hero-slider", slides });
    } else {
      out.push(sections[i]);
      i++;
    }
  }
  return out;
}

export default async function HomePage() {
  const [homePage, shapes] = await Promise.all([
    getHomePage(),
    getShapes(),
  ]);

  const rawSections: any[] = homePage?.sections ?? DEFAULT_SECTIONS; // eslint-disable-line @typescript-eslint/no-explicit-any
  const sections = groupHeroBanners(rawSections);

  return (
    <>
      {sections.map((section, i) => {
        const Component = BLOCK_MAP[section.blockType];
        if (!Component) return null;

        // ShapeGridSection needs the shapes list fetched server-side
        const extraProps = section.blockType === "shape-grid" ? { shapes } : {};

        return <Component key={i} {...section} {...extraProps} />;
      })}

      {/* Newsletter — always shown on homepage, above the global footer */}
      <NewsletterSection />
    </>
  );
}
