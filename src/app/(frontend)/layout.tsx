import type { Metadata } from "next";
import { Geist, Cormorant_Garamond } from "next/font/google";
import "./styles.css";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";

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
    default: "Dazzlez — Fine Lab-Grown & Natural Diamond Jewellery",
    template: "%s | Dazzlez",
  },
  description:
    "Celebrate your moments with personal jewellery. Transparent pricing, certified diamonds, made to order.",
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
