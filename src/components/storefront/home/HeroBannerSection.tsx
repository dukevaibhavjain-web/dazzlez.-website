import Link from "next/link";
import { CustomizationChatSection } from "@/components/storefront/home/CustomizationChatSection";

type Props = {
  heading: string;
  subheading?: string | null;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  backgroundColor?: "navy" | "cream" | "white";
  primaryCtaText?: string | null;
  primaryCtaLink?: string | null;
  secondaryCtaText?: string | null;
  secondaryCtaLink?: string | null;
  splitMode?: "full" | "split-chat";
};

const BG: Record<string, string> = {
  navy: "bg-navy text-cream",
  cream: "bg-cream-200 text-navy",
  white: "bg-white text-navy",
};

export function HeroBannerSection({
  heading,
  subheading,
  imageUrl,
  mobileImageUrl,
  backgroundColor = "navy",
  primaryCtaText,
  primaryCtaLink,
  secondaryCtaText,
  secondaryCtaLink,
  splitMode = "full",
}: Props) {
  const hasImage = Boolean(imageUrl);
  const bgClass = BG[backgroundColor] ?? BG.navy;
  const isDark = backgroundColor === "navy";

  return (
    <section
      className={`relative w-full overflow-hidden ${
        hasImage
          ? "h-[420px] sm:h-[480px] md:h-[520px]"  /* fixed banner height when image is set */
          : bgClass
      }`}
    >
      {/* Background image */}
      {hasImage && (
        <picture className="absolute inset-0 w-full h-full">
          {mobileImageUrl && (
            <source media="(max-width: 640px)" srcSet={mobileImageUrl} />
          )}
          <img
            src={imageUrl!}
            alt={heading}
            className="w-full h-full object-cover object-center"
          />
        </picture>
      )}

      {/* Scrim — improves text legibility over photos */}
      {hasImage && (
        <div className="absolute inset-0 bg-navy/45" />
      )}

      {/* ── Content ── */}
      {hasImage ? (
        /* Image hero */
        splitMode === "split-chat" ? (
          /* Split: left content + right compact chat box */
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: heading + CTAs */}
            <div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-tight text-cream">
                {heading}
              </h1>
              {subheading && (
                <p className="mt-4 text-cream/80 leading-relaxed text-base md:text-lg max-w-md">
                  {subheading}
                </p>
              )}
              {(primaryCtaText || secondaryCtaText) && (
                <div className="mt-7 flex flex-wrap gap-4">
                  {primaryCtaText && (
                    <Link
                      href={primaryCtaLink || "/collections/rings"}
                      className="bg-gold text-navy font-medium px-7 py-3 rounded-full hover:bg-gold/90 transition-colors"
                    >
                      {primaryCtaText}
                    </Link>
                  )}
                  {secondaryCtaText && (
                    <Link
                      href={secondaryCtaLink || "/collections/rings"}
                      className="border border-cream/40 text-cream px-7 py-3 rounded-full hover:border-gold hover:text-gold transition-colors"
                    >
                      {secondaryCtaText}
                    </Link>
                  )}
                </div>
              )}
            </div>
            {/* Right: compact AI chat initiator */}
            <div className="hidden md:flex items-center justify-center">
              <div className="w-full max-w-sm">
                <CustomizationChatSection compact />
              </div>
            </div>
          </div>
        ) : (
          /* Full-width: single column centred */
          <div className="relative h-full flex items-center px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="max-w-xl">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-tight text-cream">
                {heading}
              </h1>
              {subheading && (
                <p className="mt-4 text-cream/80 leading-relaxed text-base md:text-lg max-w-md">
                  {subheading}
                </p>
              )}
              {(primaryCtaText || secondaryCtaText) && (
                <div className="mt-7 flex flex-wrap gap-4">
                  {primaryCtaText && (
                    <Link
                      href={primaryCtaLink || "/collections/rings"}
                      className="bg-gold text-navy font-medium px-7 py-3 rounded-full hover:bg-gold/90 transition-colors"
                    >
                      {primaryCtaText}
                    </Link>
                  )}
                  {secondaryCtaText && (
                    <Link
                      href={secondaryCtaLink || "/collections/rings"}
                      className="border border-cream/40 text-cream px-7 py-3 rounded-full hover:border-gold hover:text-gold transition-colors"
                    >
                      {secondaryCtaText}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        /* No-image hero: 2-col layout */
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="font-display text-5xl md:text-6xl leading-tight">
              {heading}
            </h1>
            {subheading && (
              <p className={`mt-5 max-w-md leading-relaxed ${isDark ? "text-cream/70" : "text-muted"}`}>
                {subheading}
              </p>
            )}
            {(primaryCtaText || secondaryCtaText) && (
              <div className="mt-8 flex flex-wrap gap-4">
                {primaryCtaText && (
                  <Link
                    href={primaryCtaLink || "/collections/rings"}
                    className="bg-gold text-navy font-medium px-7 py-3 rounded-full hover:bg-gold/90 transition-colors"
                  >
                    {primaryCtaText}
                  </Link>
                )}
                {secondaryCtaText && (
                  <Link
                    href={secondaryCtaLink || "/collections/rings"}
                    className="border border-cream/30 px-7 py-3 rounded-full hover:border-gold hover:text-gold transition-colors"
                  >
                    {secondaryCtaText}
                  </Link>
                )}
              </div>
            )}
          </div>
          {/* Right: compact chat (split-chat mode) or decorative circle */}
          <div className="relative hidden md:flex items-center justify-center">
            {splitMode === "split-chat" ? (
              <div className="w-full max-w-sm">
                <CustomizationChatSection compact />
              </div>
            ) : (
              <div className="aspect-square w-72 rounded-full bg-gradient-to-br from-gold/30 to-navy-500 flex items-center justify-center">
                <span className="font-display text-7xl text-gold/80">✦</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
