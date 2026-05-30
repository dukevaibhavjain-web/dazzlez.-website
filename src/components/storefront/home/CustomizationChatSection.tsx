"use client";

/**
 * CustomizationChatSection — static CTA card that opens the /design page.
 *
 * Appears in two places:
 *   1. Homepage "AI Advisor" section (default mode — navy background section)
 *   2. Hero split-chat side column (compact mode — glassmorphism card)
 *
 * All questionnaire/modal logic has moved to DesignAdvisor on /design.
 */

import { useRouter } from "next/navigation";
import { pixel } from "@/lib/pixel";

type Props = {
  heading?:        string | null;
  subheading?:     string | null;
  ctaLabel?:       string | null;
  compact?:        boolean;
  /** unused — kept for CMS block schema compatibility */
  placeholderText?: string | null;
  whatsappNumber?:  string | null;
};

export function CustomizationChatSection({
  heading     = "Find Your Perfect Piece",
  subheading  = "Tell us what you're looking for — our advisor will match you with the right options.",
  ctaLabel    = "Start Designing",
  compact     = false,
}: Props) {
  const router = useRouter();

  const handleStart = () => {
    pixel.chatbotOpened();
    router.push("/design");
  };

  // ── Compact card (hero split-chat column) ──────────────────────────────────
  if (compact) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8">
        <p className="eyebrow text-gold/80 mb-2">AI Advisor</p>
        <h3 className="font-display text-2xl text-cream mb-2">{heading}</h3>
        <p className="text-cream/75 text-sm leading-relaxed mb-6">{subheading}</p>
        <button
          type="button"
          onClick={handleStart}
          className="w-full bg-gold text-navy font-medium py-3 rounded-full hover:bg-gold/90 transition-colors text-sm"
        >
          {ctaLabel} →
        </button>
        {/* Preview steps */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {["💍 Rings", "🎁 Gifts", "💎 Budget", "✨ Style"].map((step) => (
            <span
              key={step}
              className="text-[11px] text-cream/50 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full"
            >
              {step}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── Full section (homepage block) ──────────────────────────────────────────
  return (
    <section className="bg-navy py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="bg-cream-200 rounded-2xl p-6 sm:p-10">
          <p className="eyebrow text-navy mb-1">AI Advisor</p>
          <h2 className="font-display text-3xl sm:text-4xl text-navy mb-2">{heading}</h2>
          <p className="text-muted text-sm leading-relaxed mb-6 max-w-lg">{subheading}</p>

          {/* Step preview chips */}
          <div className="flex flex-wrap gap-2 mb-7">
            {[
              { emoji: "1️⃣", label: "Occasion" },
              { emoji: "2️⃣", label: "Jewellery type" },
              { emoji: "3️⃣", label: "Budget" },
              { emoji: "4️⃣", label: "Preference" },
            ].map((s) => (
              <span
                key={s.label}
                className="flex items-center gap-1.5 text-xs text-navy/60 bg-white border border-navy/10 px-3 py-1.5 rounded-full"
              >
                <span>{s.emoji}</span>
                {s.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-xs text-gold font-medium bg-gold/10 border border-gold/20 px-3 py-1.5 rounded-full">
              ✦ See matching results
            </span>
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="bg-gold text-navy font-medium px-8 py-3 rounded-full hover:bg-gold/90 transition-colors text-sm"
          >
            {ctaLabel} →
          </button>
        </div>
      </div>
    </section>
  );
}
