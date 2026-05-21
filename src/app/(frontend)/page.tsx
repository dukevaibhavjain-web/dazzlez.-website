import Link from "next/link";
import { getCategories } from "@/lib/storefront/catalog";

export const revalidate = 300;

const SHAPES = ["Round", "Oval", "Princess", "Pear", "Heart", "Cushion"];

export default async function HomePage() {
  const categories = await getCategories();
  const shopCategories = categories.filter((c) =>
    ["rings", "earrings", "necklaces", "bracelets"].includes(c.slug),
  );

  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="eyebrow mb-3">Fine Diamond Jewellery</p>
            <h1 className="font-display text-5xl md:text-6xl leading-tight">
              Celebrate your moments with jewellery as personal as they are.
            </h1>
            <p className="mt-5 text-cream/70 max-w-md leading-relaxed">
              Lab-grown &amp; natural diamonds. 100% transparent pricing. Certified,
              BIS-hallmarked, and crafted to order — or pick from ready stock.
            </p>
            <div className="mt-8 flex gap-4">
              <Link
                href="/collections/rings"
                className="bg-gold text-navy font-medium px-7 py-3 rounded-full hover:bg-gold-300 transition-colors"
              >
                Shop Rings
              </Link>
              <Link
                href="/collections/earrings"
                className="border border-cream/30 text-cream px-7 py-3 rounded-full hover:border-gold hover:text-gold transition-colors"
              >
                Explore Collection
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-full bg-gradient-to-br from-gold/30 to-navy-500 flex items-center justify-center">
              <span className="font-display text-7xl text-gold/80">✦</span>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by category */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <p className="eyebrow">Shop By</p>
          <h2 className="font-display text-4xl text-navy mt-1">Category</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {shopCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/collections/${cat.slug}`}
              className="group relative aspect-[4/5] rounded-lg overflow-hidden bg-navy flex items-end p-5"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <span className="relative font-display text-2xl text-cream group-hover:text-gold transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Shop by shape */}
      <section className="bg-cream-200 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="eyebrow">Shop By</p>
            <h2 className="font-display text-4xl text-navy mt-1">Shape</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {SHAPES.map((shape) => (
              <Link
                key={shape}
                href={`/collections/rings?shape=${shape.toLowerCase()}`}
                className="px-6 py-2.5 bg-white rounded-full border border-cream-200 text-sm hover:border-gold hover:text-gold transition-colors"
              >
                {shape}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency promise */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {[
            { t: "100% Transparent Pricing", d: "See exactly what you pay — metal, diamonds, making. Compare natural vs lab-grown side by side." },
            { t: "Certified & Hallmarked", d: "Every piece is BIS-hallmarked with certified solitaires. Full stone disclosure, always." },
            { t: "Made for You", d: "Most pieces are crafted to order. Talk to a designer on WhatsApp to personalise yours." },
          ].map((item) => (
            <div key={item.t}>
              <div className="text-gold text-3xl mb-3 font-display">✦</div>
              <h3 className="font-display text-xl text-navy mb-2">{item.t}</h3>
              <p className="text-muted text-sm leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
