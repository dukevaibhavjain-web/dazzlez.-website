import Image from "next/image";
import Link from "next/link";
import { HeaderActions } from "./HeaderActions";

const NAV = [
  { label: "Rings",      href: "/collections/rings" },
  { label: "Earrings",   href: "/collections/earrings" },
  { label: "Necklaces",  href: "/collections/necklaces" },
  { label: "Bracelets",  href: "/collections/bracelets" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-navy text-cream">
      {/* Announcement bar */}
      <div className="bg-gold/90 text-navy text-center text-xs py-1.5 font-medium tracking-wide">
        USE CODE &lsquo;DAZZLEZ&rsquo; TO GET 5% OFF ON YOUR FIRST ORDER
      </div>

      {/* Main nav row — taller to give the logo room */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">

          {/* Left nav */}
          <nav className="hidden md:flex gap-6 text-sm flex-1">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="hover:text-gold transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Logo — centred, given generous height */}
          <Link href="/" className="flex-shrink-0" aria-label="The Dazzlez — Home">
            <Image
              src="/logo-white.png"
              alt="The Dazzlez"
              width={160}
              height={64}
              priority
              className="h-16 w-auto object-contain"
            />
          </Link>

          {/* Right actions — client component (search modal + cart badge) */}
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
