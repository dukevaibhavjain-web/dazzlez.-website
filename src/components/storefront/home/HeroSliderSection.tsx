"use client";

/**
 * HeroSliderSection
 *
 * Receives an array of hero-banner slides (same props as HeroBannerSection).
 * - 1 slide  → renders statically (no controls, no JS overhead)
 * - 2+ slides → auto-advancing carousel with fade transition,
 *               prev/next arrows, and dot indicators.
 *
 * Auto-advance pauses on hover.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { CustomizationChatSection } from "@/components/storefront/home/CustomizationChatSection";

type Slide = {
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

type Props = { slides: Slide[] };

const BG: Record<string, string> = {
  navy: "bg-navy text-cream",
  cream: "bg-cream-200 text-navy",
  white: "bg-white text-navy",
};

function SlideContent({ slide, active }: { slide: Slide; active: boolean }) {
  const hasImage = Boolean(slide.imageUrl);
  const bgClass = BG[slide.backgroundColor ?? "navy"] ?? BG.navy;
  const isDark = (slide.backgroundColor ?? "navy") === "navy";

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
        active ? "opacity-100 z-10" : "opacity-0 z-0"
      } ${hasImage ? "" : bgClass}`}
      aria-hidden={!active}
    >
      {/* Background image */}
      {hasImage && (
        <picture className="absolute inset-0 w-full h-full">
          {slide.mobileImageUrl && (
            <source media="(max-width: 640px)" srcSet={slide.mobileImageUrl} />
          )}
          <img
            src={slide.imageUrl!}
            alt={slide.heading}
            className="w-full h-full object-cover object-center"
          />
        </picture>
      )}

      {/* Scrim */}
      {hasImage && <div className="absolute inset-0 bg-navy/45" />}

      {/* Text content */}
      {slide.splitMode === "split-chat" && hasImage ? (
        /* Split mode: left content + right compact chat */
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-tight text-cream">
              {slide.heading}
            </h1>
            {slide.subheading && (
              <p className="mt-4 text-cream/80 leading-relaxed text-base md:text-lg max-w-md">
                {slide.subheading}
              </p>
            )}
            {(slide.primaryCtaText || slide.secondaryCtaText) && (
              <div className="mt-7 flex flex-wrap gap-4">
                {slide.primaryCtaText && (
                  <Link
                    href={slide.primaryCtaLink || "/collections/rings"}
                    className="bg-gold text-navy font-medium px-7 py-3 rounded-full hover:bg-gold/90 transition-colors"
                  >
                    {slide.primaryCtaText}
                  </Link>
                )}
                {slide.secondaryCtaText && (
                  <Link
                    href={slide.secondaryCtaLink || "/collections/rings"}
                    className="border border-cream/40 text-cream px-7 py-3 rounded-full hover:border-gold hover:text-gold transition-colors"
                  >
                    {slide.secondaryCtaText}
                  </Link>
                )}
              </div>
            )}
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="w-full max-w-sm">
              <CustomizationChatSection compact />
            </div>
          </div>
        </div>
      ) : (
        /* Full-width mode */
        <div
          className={`relative h-full flex items-center px-4 sm:px-6 max-w-7xl mx-auto ${
            !hasImage ? "py-20 md:py-28" : ""
          }`}
        >
          <div className="max-w-xl">
            <h1
              className={`font-display text-4xl sm:text-5xl md:text-6xl leading-tight ${
                hasImage || isDark ? "text-cream" : "text-navy"
              }`}
            >
              {slide.heading}
            </h1>

            {slide.subheading && (
              <p
                className={`mt-4 leading-relaxed text-base md:text-lg max-w-md ${
                  hasImage || isDark ? "text-cream/80" : "text-muted"
                }`}
              >
                {slide.subheading}
              </p>
            )}

            {(slide.primaryCtaText || slide.secondaryCtaText) && (
              <div className="mt-7 flex flex-wrap gap-4">
                {slide.primaryCtaText && (
                  <Link
                    href={slide.primaryCtaLink || "/collections/rings"}
                    className="bg-gold text-navy font-medium px-7 py-3 rounded-full hover:bg-gold/90 transition-colors"
                  >
                    {slide.primaryCtaText}
                  </Link>
                )}
                {slide.secondaryCtaText && (
                  <Link
                    href={slide.secondaryCtaLink || "/collections/rings"}
                    className="border border-cream/40 text-cream px-7 py-3 rounded-full hover:border-gold hover:text-gold transition-colors"
                  >
                    {slide.secondaryCtaText}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function HeroSliderSection({ slides }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = slides.length;

  const goTo = useCallback((idx: number) => {
    setCurrent((idx + total) % total);
  }, [total]);

  // Auto-advance every 5 s, pause on hover
  useEffect(() => {
    if (total <= 1 || paused) return;
    timerRef.current = setTimeout(() => goTo(current + 1), 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, total, goTo]);

  return (
    <section
      className="relative w-full overflow-hidden h-[420px] sm:h-[480px] md:h-[520px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((slide, i) => (
        <SlideContent key={i} slide={slide} active={i === current} />
      ))}

      {/* Prev / Next arrows — only when 2+ slides */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          >
            ›
          </button>
        </>
      )}

      {/* Dot indicators — only when 2+ slides */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "bg-gold w-5"
                  : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
