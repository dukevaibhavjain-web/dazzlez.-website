/**
 * chatbotConfigTypes.ts — types + default flow config for the Design Advisor.
 *
 * ✅ Client-safe — NO Payload / Node.js imports.
 *    Import from both server and client components.
 *
 * The server-only fetch function lives in chatbotConfig.ts.
 */

// ── Special terminal step keys ────────────────────────────────────────────────
/** Routes to the product results grid */
export const STEP_RESULTS = "__results__";
/** Routes to the contact-only form (no product grid) */
export const STEP_CONTACT = "__contact__";

// ── Option type (used by choice steps) ───────────────────────────────────────

export type ChoiceOption = {
  label: string;
  emoji?: string;
  /** stepKey of next step, or STEP_RESULTS / STEP_CONTACT */
  goToStepKey: string;
  /** Maps to product category filter in results */
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  /** "prefer-chat" → skip product grid, go straight to contact/results */
  behavior?: "normal" | "prefer-chat";
  /** Tone of the pre-filled WhatsApp message */
  waStyle?: "standard" | "reference" | "expert" | "describe";
  /** Custom pixel event name fired when this option is picked */
  pixelEvent?: string;
  /** JSON string of extra params passed to the pixel event */
  pixelParams?: string;
};

// ── Step types ────────────────────────────────────────────────────────────────

export type ChoiceStep = {
  kind: "choice";
  stepKey: string;
  questionText: string;
  subtitle: string;
  options: ChoiceOption[];
};

export type DescribeStep = {
  kind: "describe";
  stepKey: string;
  questionText: string;
  subtitle: string;
  placeholder: string;
  hints: string[];
  goToStepKey: string;
};

export type UploadStep = {
  kind: "upload";
  stepKey: string;
  questionText: string;
  subtitle: string;
  goToStepKey: string;
};

/** Terminal step — renders product grid. No admin config. */
export type ResultsStep = { kind: "results"; stepKey: string };

/** Terminal step — renders contact form only. No admin config. */
export type ContactStep = { kind: "contact"; stepKey: string };

export type FlowStep = ChoiceStep | DescribeStep | UploadStep | ResultsStep | ContactStep;

// ── Full config shape ─────────────────────────────────────────────────────────

export type FlowConfig = {
  /** stepKey of the first step to show the customer */
  entryStepKey: string;
  steps: FlowStep[];
};

// ── Default flow (hardcoded fallback when CMS global is empty) ────────────────

export const DEFAULT_FLOW_CONFIG: FlowConfig = {
  entryStepKey: "occasion",
  steps: [
    {
      kind: "choice",
      stepKey: "occasion",
      questionText: "First things first",
      subtitle: "What's the occasion?",
      options: [
        { label: "Engagement / Wedding", emoji: "💍", goToStepKey: "product", waStyle: "standard" },
        { label: "Gift",                 emoji: "🎁", goToStepKey: "product", waStyle: "standard" },
        { label: "Anniversary",          emoji: "💝", goToStepKey: "product", waStyle: "standard" },
        { label: "Self-treat",           emoji: "✨", goToStepKey: "product", waStyle: "standard" },
        { label: "Other",                emoji: "👤", goToStepKey: "product", waStyle: "standard" },
      ],
    },
    {
      kind: "choice",
      stepKey: "product",
      questionText: "What type of jewellery?",
      subtitle: "Rings, pendants, earrings…",
      options: [
        { label: "Ring",     emoji: "💍", goToStepKey: "budget", categorySlug: "rings"     },
        { label: "Pendant",  emoji: "📿", goToStepKey: "budget", categorySlug: "necklaces" },
        { label: "Earrings", emoji: "✨", goToStepKey: "budget", categorySlug: "earrings"  },
        { label: "Bracelet", emoji: "💎", goToStepKey: "budget", categorySlug: "bracelets" },
        { label: "Other",    emoji: "👤", goToStepKey: "budget", categorySlug: ""          },
      ],
    },
    {
      kind: "choice",
      stepKey: "budget",
      questionText: "Budget Range",
      subtitle: "Got a budget in mind?",
      options: [
        { label: "Upto ₹50,000",        goToStepKey: "preference", minPrice: 0,       maxPrice: 50_000,  behavior: "normal"      },
        { label: "₹50,000 – ₹1,00,000", goToStepKey: "preference", minPrice: 50_000,  maxPrice: 100_000, behavior: "normal"      },
        { label: "₹1L – ₹2.5L",         goToStepKey: "preference", minPrice: 100_000, maxPrice: 250_000, behavior: "normal"      },
        { label: "I'd prefer to chat",   goToStepKey: STEP_RESULTS, minPrice: 0,       maxPrice: 0,       behavior: "prefer-chat" },
      ],
    },
    {
      kind: "choice",
      stepKey: "preference",
      questionText: "Design Preference",
      subtitle: "Do you have a design in mind, or shall we suggest?",
      options: [
        { label: "I have a reference / image", emoji: "📎", goToStepKey: "upload",      waStyle: "reference" },
        { label: "I want expert suggestions",  emoji: "🎨", goToStepKey: STEP_RESULTS,  waStyle: "expert"    },
        { label: "I want handpicked options",  emoji: "🛍️", goToStepKey: STEP_RESULTS,  waStyle: "standard"  },
        { label: "Other",                      emoji: "💬", goToStepKey: "describe",    waStyle: "describe"  },
      ],
    },
    {
      kind: "describe",
      stepKey: "describe",
      questionText: "Describe your vision",
      subtitle:
        "Tell us anything that helps — occasion, style, metal, gemstone, how they'll wear it…",
      placeholder:
        "E.g. \"A dainty rose-gold ring with a small oval diamond for my wife's birthday — she loves minimalist jewellery and wears it daily.\"",
      hints: [
        "✦ Minimalist",
        "💫 Statement piece",
        "👑 Classic / Traditional",
        "🌸 Modern",
        "🔮 Vintage style",
        "🌿 Lab-grown diamond",
        "💛 Natural diamond",
      ],
      goToStepKey: STEP_RESULTS,
    },
    {
      kind: "upload",
      stepKey: "upload",
      questionText: "Upload your reference",
      subtitle:
        "Share up to 3 images — our advisor will reach out based on your style.",
      goToStepKey: STEP_RESULTS,
    },
  ],
};
