import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-navy text-cream/80 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="font-display text-xl text-cream mb-3">DAZZLEZ</div>
          <p className="text-cream/60 leading-relaxed">
            Fine lab-grown &amp; natural diamond jewellery. Crafted for love,
            self-worth, and everything in between.
          </p>
        </div>
        <div>
          <h4 className="eyebrow mb-3">Shop</h4>
          <ul className="space-y-2">
            <li><Link href="/collections/rings" className="hover:text-gold">Rings</Link></li>
            <li><Link href="/collections/earrings" className="hover:text-gold">Earrings</Link></li>
            <li><Link href="/collections/necklaces" className="hover:text-gold">Necklaces</Link></li>
            <li><Link href="/collections/bracelets" className="hover:text-gold">Bracelets</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow mb-3">Company</h4>
          <ul className="space-y-2">
            <li><Link href="/about" className="hover:text-gold">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-gold">Contact</Link></li>
            <li><Link href="/partners/affiliate" className="hover:text-gold">Affiliate Program</Link></li>
            <li><Link href="/partners/designer" className="hover:text-gold">Designer Signup</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow mb-3">Contact</h4>
          <p className="text-cream/60 leading-relaxed">
            Malviya Nagar, Jaipur 302017<br />
            +91 98291 15205<br />
            info@dazzlez.co
          </p>
        </div>
      </div>
      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} Dazzlez.co — All Rights Reserved.
      </div>
    </footer>
  );
}
