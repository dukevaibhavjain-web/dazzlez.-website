import Link from "next/link";

const NAV = [
  { label: "Collection", href: "/collections/rings" },
  { label: "Rings", href: "/collections/rings" },
  { label: "Earrings", href: "/collections/earrings" },
  { label: "Necklaces", href: "/collections/necklaces" },
  { label: "Bracelets", href: "/collections/bracelets" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-navy text-cream">
      <div className="bg-gold/90 text-navy text-center text-xs py-1.5 font-medium tracking-wide">
        USE CODE &lsquo;DAZZLEZ&rsquo; TO GET 5% OFF ON YOUR FIRST ORDER
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <nav className="hidden md:flex gap-6 text-sm flex-1">
            {NAV.slice(1).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="hover:text-gold transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link href="/" className="font-display text-2xl tracking-widest font-semibold">
            DAZZLEZ
          </Link>

          <div className="flex items-center justify-end gap-5 text-sm flex-1">
            <Link href="/login" className="hover:text-gold transition-colors">
              Account
            </Link>
            <Link href="/cart" className="hover:text-gold transition-colors">
              Cart
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
