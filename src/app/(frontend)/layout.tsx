import type { Metadata } from "next";
import { Geist, Cormorant_Garamond } from "next/font/google";
import "./styles.css";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { TrackingScripts } from "@/components/storefront/TrackingScripts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "The Dazzlez — Pure & Guilt Free Jewelry",
    template: "%s | The Dazzlez",
  },
  description:
    "Celebrate your moments with personal jewellery. Transparent pricing, certified diamonds, made to order.",
  icons: {
    icon: [
      { url: "/logo-square.jpg", type: "image/jpeg" },
    ],
    apple: "/logo-square.jpg",
    shortcut: "/logo-square.jpg",
  },
  openGraph: {
    images: [{ url: "/logo-square.jpg", width: 1080, height: 1080, alt: "The Dazzlez" }],
    siteName: "The Dazzlez",
    locale: "en_IN",
    type: "website",
  },
};

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${cormorant.variable} h-full antialiased scroll-smooth`}
    >
      <body
        className="min-h-full flex flex-col bg-cream text-ink"
        suppressHydrationWarning
      >
        <TrackingScripts />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
