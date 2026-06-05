import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/storefront/NewsletterForm";

// ── Social icons (inline SVG — no icon-lib dep) ──────────────────────────────
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const WhatsappIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);

// ── SEO link data ─────────────────────────────────────────────────────────────
const SEO_SECTIONS = [
  {
    heading: "Shop Rings",
    links: [
      { label: "Engagement Rings",       href: "/collections/rings?style=engagement" },
      { label: "Solitaire Rings",        href: "/collections/rings?style=solitaire" },
      { label: "Halo Rings",             href: "/collections/rings?style=halo" },
      { label: "Cocktail Rings",         href: "/collections/rings?style=cocktail" },
      { label: "Men's Rings",            href: "/collections/rings?style=mens" },
      { label: "Yellow Gold Rings",      href: "/collections/rings?metals=18K" },
      { label: "White Gold Rings",       href: "/collections/rings?metals=14K" },
      { label: "Rose Gold Rings",        href: "/collections/rings?metals=18K" },
      { label: "18K Gold Rings",         href: "/collections/rings?metals=18K" },
      { label: "14K Gold Rings",         href: "/collections/rings?metals=14K" },
      { label: "Rings under ₹50,000",   href: "/collections/rings?maxPrice=50000&sort=price-asc" },
      { label: "Rings ₹50k–₹1L",        href: "/collections/rings?minPrice=50000&maxPrice=100000" },
      { label: "Ready to Ship Rings",    href: "/collections/rings?inStock=true" },
    ],
  },
  {
    heading: "Shop Earrings",
    links: [
      { label: "Stud Earrings",          href: "/collections/earrings?style=studs" },
      { label: "Drop Earrings",          href: "/collections/earrings?style=drops" },
      { label: "Halo Earrings",          href: "/collections/earrings?style=halo" },
      { label: "Cluster Earrings",       href: "/collections/earrings?style=cluster" },
      { label: "Men's Studs",            href: "/collections/earrings?style=mens" },
      { label: "Yellow Gold Earrings",   href: "/collections/earrings?metals=18K" },
      { label: "White Gold Earrings",    href: "/collections/earrings?metals=14K" },
      { label: "Rose Gold Earrings",     href: "/collections/earrings?metals=18K" },
      { label: "18K Gold Earrings",      href: "/collections/earrings?metals=18K" },
      { label: "Earrings under ₹30,000", href: "/collections/earrings?maxPrice=30000&sort=price-asc" },
      { label: "Ready to Ship Earrings", href: "/collections/earrings?inStock=true" },
    ],
  },
  {
    heading: "Shop Necklaces",
    links: [
      { label: "Solitaire Necklaces",    href: "/collections/necklaces?style=solitaire" },
      { label: "Diamond Pendants",       href: "/collections/necklaces?style=pendant" },
      { label: "Mangalsutra",            href: "/collections/necklaces?style=mangalsutra" },
      { label: "Yellow Gold Necklaces",  href: "/collections/necklaces?metals=18K" },
      { label: "White Gold Necklaces",   href: "/collections/necklaces?metals=14K" },
      { label: "Rose Gold Necklaces",    href: "/collections/necklaces?metals=18K" },
      { label: "18K Gold Necklaces",     href: "/collections/necklaces?metals=18K" },
      { label: "Necklaces under ₹50,000", href: "/collections/necklaces?maxPrice=50000&sort=price-asc" },
    ],
  },
  {
    heading: "Shop Bracelets",
    links: [
      { label: "Tennis Bracelets",         href: "/collections/bracelets?style=tennis" },
      { label: "Diamond Bracelets",        href: "/collections/bracelets" },
      { label: "Men's Bracelets",          href: "/collections/bracelets?style=mens" },
      { label: "Yellow Gold Bracelets",    href: "/collections/bracelets?metals=18K" },
      { label: "White Gold Bracelets",     href: "/collections/bracelets?metals=14K" },
      { label: "Silver Bracelets",         href: "/collections/bracelets?metals=Silver925" },
      { label: "Bracelets under ₹30,000",  href: "/collections/bracelets?maxPrice=30000&sort=price-asc" },
      { label: "Ready to Ship Bracelets",  href: "/collections/bracelets?inStock=true" },
    ],
  },
  {
    heading: "Shop by Metal",
    links: [
      { label: "9K Gold Jewellery",        href: "/collections/rings?metals=9K" },
      { label: "14K Gold Jewellery",       href: "/collections/rings?metals=14K" },
      { label: "18K Gold Jewellery",       href: "/collections/rings?metals=18K" },
      { label: "22K Gold Jewellery",       href: "/collections/rings?metals=22K" },
      { label: "Sterling Silver",          href: "/collections/rings?metals=Silver925" },
      { label: "Platinum Jewellery",       href: "/collections/rings?metals=Platinum" },
      { label: "Lab-Grown Diamonds",       href: "/collections/rings" },
      { label: "Natural Diamonds",         href: "/collections/rings" },
      { label: "Solitaire Jewellery",      href: "/collections/rings?style=solitaire" },
    ],
  },
  {
    heading: "Gifting",
    links: [
      { label: "Engagement Gifts",         href: "/collections/rings?style=engagement" },
      { label: "Anniversary Gifts",        href: "/collections/rings" },
      { label: "Gifts for Her",            href: "/collections/rings" },
      { label: "Gifts for Him",            href: "/collections/rings?style=mens" },
      { label: "Wedding Gifts",            href: "/collections/necklaces" },
      { label: "Valentine Gifts",          href: "/collections/rings" },
      { label: "Birthday Gifts",           href: "/collections/earrings" },
      { label: "Gifts under ₹30,000",      href: "/collections/earrings?maxPrice=30000&sort=price-asc" },
      { label: "Gifts under ₹50,000",      href: "/collections/rings?maxPrice=50000&sort=price-asc" },
      { label: "Try at Home",              href: "/try-at-home" },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-cream/80 mt-20">

      {/* ── Social bar ─────────────────────────────────────────────────────── */}
      <div className="border-b border-cream/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-center sm:justify-between gap-4">
          <p className="text-sm text-cream/60 tracking-widest uppercase text-center sm:text-left">
            Follow us on
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://www.instagram.com/thedazzlez"
              target="_blank" rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-cream/50 hover:text-gold transition-colors"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://www.youtube.com/@thedazzlez"
              target="_blank" rel="noopener noreferrer"
              aria-label="YouTube"
              className="text-cream/50 hover:text-gold transition-colors"
            >
              <YoutubeIcon />
            </a>
            <a
              href="https://www.pinterest.com/thedazzlez"
              target="_blank" rel="noopener noreferrer"
              aria-label="Pinterest"
              className="text-cream/50 hover:text-gold transition-colors"
            >
              <PinterestIcon />
            </a>
            <a
              href="https://wa.me/919829115205"
              target="_blank" rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="text-cream/50 hover:text-gold transition-colors"
            >
              <WhatsappIcon />
            </a>
          </div>
        </div>
      </div>

      {/* ── Newsletter strip ────────────────────────────────────────────────── */}
      <div className="border-b border-cream/10 bg-navy-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid sm:grid-cols-3 gap-6 items-center">
          {/* Left */}
          <div>
            <p className="font-display text-xl text-cream">Join The Dazzlez Club</p>
            <p className="text-cream/50 text-sm mt-1 leading-relaxed">
              New arrivals, exclusive offers &amp; diamond care tips — straight to your inbox.
            </p>
          </div>
          {/* Centre — interactive form (client component) */}
          <NewsletterForm />
          {/* Right */}
          <div className="text-sm text-cream/50 space-y-1.5 sm:text-right">
            <p className="text-cream/70 font-medium">Here to assist</p>
            <p>
              <a href="tel:+919829115205" className="hover:text-gold transition-colors">
                +91 98291 15205
              </a>
            </p>
            <p>
              <a href="mailto:info@dazzlez.co" className="hover:text-gold transition-colors">
                info@dazzlez.co
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* ── Main columns ────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Image src="/logo-white.png" alt="The Dazzlez" width={160} height={80} className="h-20 w-auto object-contain mb-4" />
          <p className="text-cream/50 leading-relaxed text-xs max-w-xs">
            Fine lab-grown &amp; natural diamond jewellery, BIS-hallmarked and certified.
            Crafted for love, self-worth, and everything in between.
          </p>
          <p className="text-cream/40 text-xs mt-4">
            Malviya Nagar, Jaipur — 302017
          </p>
        </div>

        {/* Shop */}
        <div>
          <h4 className="eyebrow mb-3 text-cream/40">Shop</h4>
          <ul className="space-y-2">
            {[
              ["Rings",      "/collections/rings"],
              ["Earrings",   "/collections/earrings"],
              ["Necklaces",  "/collections/necklaces"],
              ["Bracelets",  "/collections/bracelets"],
              ["New Arrivals", "/collections/rings?sort=featured"],
              ["Ready to Ship", "/collections/rings?inStock=true"],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="hover:text-gold transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="eyebrow mb-3 text-cream/40">Company</h4>
          <ul className="space-y-2">
            {[
              ["About Us",        "/about"],
              ["Contact Us",      "/contact"],
              ["Try at Home",     "/try-at-home"],
              ["Affiliate Program", "/partners/affiliate"],
              ["Designer Signup", "/partners/designer"],
              ["Privacy Policy",  "/privacy"],
              ["Terms of Service", "/terms"],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="hover:text-gold transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help */}
        <div>
          <h4 className="eyebrow mb-3 text-cream/40">Help</h4>
          <ul className="space-y-2">
            {[
              ["Ring Size Guide",     "/ring-size-guide"],
              ["Diamond Guide",       "/diamond-guide"],
              ["Hallmarking & Cert.", "/certifications"],
              ["Return Policy",       "/returns"],
              ["Shipping & Delivery", "/shipping"],
              ["FAQs",                "/faqs"],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="hover:text-gold transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── SEO text wall ───────────────────────────────────────────────────── */}
      <div className="border-t border-cream/10 bg-navy-900/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <p className="eyebrow text-cream/30 mb-6">Popular Searches</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-xs">
            {SEO_SECTIONS.map((section) => (
              <div key={section.heading}>
                <p className="text-cream/50 font-medium mb-2 uppercase tracking-wider text-[10px]">
                  {section.heading}
                </p>
                <ul className="space-y-1.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-cream/35 hover:text-gold transition-colors leading-snug block"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Copyright bar ───────────────────────────────────────────────────── */}
      <div className="border-t border-cream/10 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-cream/30">
          <span>© {year} Dazzlez.co — All Rights Reserved.</span>
          <span className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-gold transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-gold transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/returns" className="hover:text-gold transition-colors">Returns</Link>
          </span>
        </div>
      </div>

    </footer>
  );
}
