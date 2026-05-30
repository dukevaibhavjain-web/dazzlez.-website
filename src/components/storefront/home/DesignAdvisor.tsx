"use client";

/**
 * DesignAdvisor — Full-page jewellery advisor questionnaire + product results.
 *
 * Flow is fully dynamic: driven by a FlowConfig graph fetched from Payload.
 * Each step has a `stepKey`; each option routes to another step by key.
 * Special terminal keys: "__results__" (product grid) and "__contact__" (form only).
 *
 * Falls back to DEFAULT_FLOW_CONFIG when no CMS config is saved.
 */

import { useState, useEffect, useRef } from "react";
import { pixel, trackCustom } from "@/lib/pixel";
import { ChatbotResults } from "./ChatbotResults";
import type { CollectionFilters } from "@/lib/storefront/types";
import type {
  FlowConfig,
  FlowStep,
  ChoiceStep,
  DescribeStep,
  UploadStep,
  ChoiceOption,
} from "@/lib/storefront/chatbotConfigTypes";
import {
  DEFAULT_FLOW_CONFIG,
  STEP_RESULTS,
  STEP_CONTACT,
} from "@/lib/storefront/chatbotConfigTypes";

// ── Types ─────────────────────────────────────────────────────────────────────

type WaStyle = "standard" | "reference" | "expert" | "describe";

type Answers = {
  occasion:        string;
  product:         string;
  category:        string;
  budget:          string;
  minPrice:        number;
  maxPrice:        number;
  preference:      string;
  preferChat:      boolean;
  referenceImages: string[];
  description:     string;
  waStyle:         WaStyle;
};

type Props = {
  flowConfig?:     FlowConfig;
  /** @deprecated kept for backwards compat — use flowConfig instead */
  chatbotConfig?:  unknown;
  heading?:        string;
  whatsappNumber?: string;
  initialOccasion?: string;
  initialProduct?:  string;
};

type PendingFile = { file: File; previewUrl: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyAnswers(): Answers {
  return {
    occasion: "", product: "", category: "", budget: "",
    minPrice: 0, maxPrice: 0, preference: "", preferChat: false,
    referenceImages: [], description: "", waStyle: "standard",
  };
}

/** Safely parse a JSON string — returns {} on failure */
function safeParseJson(s?: string): Record<string, unknown> {
  if (!s) return {};
  try { return JSON.parse(s) as Record<string, unknown>; }
  catch { return {}; }
}

/**
 * Derive answer fields from a choice option.
 * Uses the step's stepKey to identify which semantic field to set.
 */
function deriveAnswerUpdate(step: ChoiceStep, option: ChoiceOption): Partial<Answers> {
  const update: Partial<Answers> = {};
  if (option.waStyle) update.waStyle = option.waStyle;
  switch (step.stepKey) {
    case "occasion":
      update.occasion = option.label;
      break;
    case "product":
      update.product  = option.label;
      update.category = option.categorySlug ?? "";
      break;
    case "budget":
      update.budget   = option.label;
      update.minPrice = option.minPrice ?? 0;
      update.maxPrice = option.maxPrice ?? 0;
      if (option.behavior === "prefer-chat") update.preferChat = true;
      break;
    case "preference":
      update.preference = option.label;
      break;
  }
  return update;
}

/** Fire the default pixel event for well-known step keys */
function fireDefaultPixel(stepKey: string, option: ChoiceOption) {
  switch (stepKey) {
    case "occasion":   pixel.occasionSelected(option.label); break;
    case "product":    pixel.productSelected(option.label);  break;
    case "budget":     pixel.budgetSelected(option.label, option.maxPrice ?? 0); break;
    case "preference": pixel.preferenceSelected(option.label); break;
    default:
      trackCustom("StepOptionSelected", { step: stepKey, option: option.label });
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-8" role="progressbar" aria-valuenow={current} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={[
          "h-1 rounded-full transition-all duration-500",
          i < current     ? "bg-gold flex-[2]"
          : i === current  ? "bg-gold/40 flex-[2]"
          : "bg-navy/10 flex-1",
        ].join(" ")} />
      ))}
    </div>
  );
}

function ChoiceButton({
  emoji, label, onClick, dashed = false,
}: {
  emoji?: string; label: string; onClick: () => void; dashed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-2.5 px-5 py-3 rounded-full text-sm font-medium shadow-sm",
        "text-navy bg-white hover:border-gold hover:text-gold transition-colors",
        dashed ? "border border-dashed border-navy/30" : "border border-navy/15",
      ].join(" ")}
    >
      {emoji && <span aria-hidden>{emoji}</span>}
      {label}
    </button>
  );
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

// ── Contact sidebar ───────────────────────────────────────────────────────────

function ContactSidebar({
  whatsappUrl, onSubmit, submitting, submitted, contact, setContact,
}: {
  whatsappUrl: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  submitted: boolean;
  contact: { name: string; phone: string; email: string; city: string };
  setContact: React.Dispatch<React.SetStateAction<{ name: string; phone: string; email: string; city: string }>>;
}) {
  const inputCls =
    "w-full border border-navy/15 rounded-xl px-4 py-2.5 text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white";

  if (submitted) {
    return (
      <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-sm text-center">
        <p className="text-4xl mb-3">🎉</p>
        <h3 className="font-display text-xl text-navy mb-2">Thanks, {contact.name || "there"}!</h3>
        <p className="text-sm text-muted leading-relaxed mb-5">
          Our jewellery expert will reach out shortly with personalised options for you.
        </p>
        <div className="flex flex-col gap-3">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            onClick={pixel.whatsappClicked}
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-medium py-3 rounded-full hover:bg-[#22c05e] transition-colors text-sm">
            <WaIcon /> Continue on WhatsApp
          </a>
          <a href="tel:+919829115205" onClick={pixel.callClicked}
            className="flex items-center justify-center gap-2 border border-navy/15 text-navy font-medium py-3 rounded-full hover:border-gold hover:text-gold transition-colors text-sm">
            📞 Call Now
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-display text-lg text-navy mb-1">Your Details</h3>
      <p className="text-xs text-muted mb-4 leading-relaxed">
        Share your contact so our expert can reach out with perfectly matched options.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <input required placeholder="Full Name *" value={contact.name}
          onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} className={inputCls} />
        <input required type="tel" placeholder="Phone Number *" value={contact.phone}
          onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} className={inputCls} />
        <input type="email" placeholder="Email Address" value={contact.email}
          onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} className={inputCls} />
        <input placeholder="City" value={contact.city}
          onChange={(e) => setContact((c) => ({ ...c, city: e.target.value }))} className={inputCls} />
        <button type="submit" disabled={submitting}
          className="w-full bg-gold text-navy font-medium py-3 rounded-full hover:bg-gold/90 transition-colors disabled:opacity-60 text-sm">
          {submitting ? "Saving…" : "Submit & Get Options →"}
        </button>
      </form>
      <div className="mt-5 pt-4 border-t border-cream-200">
        <p className="text-xs text-muted text-center mb-3">or connect directly</p>
        <div className="flex flex-col gap-2">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            onClick={pixel.whatsappClicked}
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-medium py-2.5 rounded-full hover:bg-[#22c05e] transition-colors text-sm">
            <WaIcon /> WhatsApp
          </a>
          <a href="tel:+919829115205" onClick={pixel.callClicked}
            className="flex items-center justify-center gap-2 border border-navy/15 text-navy font-medium py-2.5 rounded-full hover:border-gold hover:text-gold transition-colors text-sm">
            📞 Call Now
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DesignAdvisor({
  flowConfig:      flowConfigProp,
  heading         = "Find Your Perfect Piece",
  whatsappNumber  = "+919829115205",
  initialOccasion,
  initialProduct,
}: Props) {
  const config: FlowConfig = flowConfigProp ?? DEFAULT_FLOW_CONFIG;

  // ── Compute initial state from URL params ──────────────────────────────────
  const getInitialState = (): {
    stepKey: string;
    answers: Answers;
    history: string[];
  } => {
    const base = emptyAnswers();

    if (!initialOccasion && !initialProduct) {
      return { stepKey: config.entryStepKey, answers: base, history: [] };
    }

    const history: string[] = [];
    const answers = { ...base };

    // Apply occasion
    if (initialOccasion) {
      answers.occasion = initialOccasion;
      history.push(config.entryStepKey);
    }

    // Apply product by categorySlug
    if (initialProduct) {
      const productStep = config.steps.find(
        (s): s is ChoiceStep => s.kind === "choice" && s.stepKey === "product",
      );
      const matchedOpt = productStep?.options.find(
        (o) => o.categorySlug === initialProduct,
      );
      if (matchedOpt) {
        answers.product  = matchedOpt.label;
        answers.category = matchedOpt.categorySlug ?? "";
        if (!history.includes("product")) history.push("product");
        // Navigate to where that product option points
        const dest = matchedOpt.goToStepKey ?? "budget";
        return { stepKey: dest, answers, history };
      }
      // Could not match product — fall back to product step
      if (initialOccasion) {
        const occasionStep = config.steps.find(
          (s): s is ChoiceStep => s.kind === "choice" && s.stepKey === "occasion",
        );
        const nextKey = occasionStep?.options[0]?.goToStepKey ?? "product";
        return { stepKey: nextKey, answers, history };
      }
    }

    if (initialOccasion) {
      const occasionStep = config.steps.find(
        (s): s is ChoiceStep => s.kind === "choice" && s.stepKey === "occasion",
      );
      const nextKey = occasionStep?.options[0]?.goToStepKey ?? "product";
      return { stepKey: nextKey, answers, history };
    }

    return { stepKey: config.entryStepKey, answers: base, history: [] };
  };

  const initial = getInitialState();

  // ── Core state ─────────────────────────────────────────────────────────────
  const [currentStepKey, setCurrentStepKey] = useState<string>(initial.stepKey);
  const [history,        setHistory]        = useState<string[]>(initial.history);
  const [answers,        setAnswers]        = useState<Answers>(initial.answers);
  const [contact,        setContact]        = useState({ name: "", phone: "", email: "", city: "" });
  const [submitting,     setSubmitting]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);

  // ── Image upload state ────────────────────────────────────────────────────
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadError,  setUploadError]  = useState("");
  const [uploading,    setUploading]    = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Describe state ────────────────────────────────────────────────────────
  const [describeText, setDescribeText] = useState("");

  // ── Pixel ─────────────────────────────────────────────────────────────────
  useEffect(() => { pixel.designPageLoaded(); }, []);

  // ── Graph navigation ───────────────────────────────────────────────────────

  function navigateTo(nextKey: string) {
    setHistory((h) => [...h, currentStepKey]);
    setCurrentStepKey(nextKey);
  }

  function back() {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setCurrentStepKey(prev);
      return h.slice(0, -1);
    });
  }

  function resetFlow() {
    setCurrentStepKey(config.entryStepKey);
    setHistory([]);
    setAnswers(emptyAnswers());
    setSubmitted(false);
    setPendingFiles([]);
    setDescribeText("");
  }

  // ── Option pick ────────────────────────────────────────────────────────────

  function handleOptionPick(step: ChoiceStep, option: ChoiceOption) {
    // Fire pixel event: custom (per-option) > default (per well-known step key)
    if (option.pixelEvent) {
      trackCustom(option.pixelEvent, safeParseJson(option.pixelParams));
    } else {
      fireDefaultPixel(step.stepKey, option);
    }

    // Accumulate semantic answer fields
    setAnswers((a) => ({ ...a, ...deriveAnswerUpdate(step, option) }));

    // prefer-chat → jump straight to results (no product grid, contact form shown)
    if (option.behavior === "prefer-chat") {
      setAnswers((a) => ({ ...a, preferChat: true }));
      navigateTo(STEP_RESULTS);
      return;
    }

    navigateTo(option.goToStepKey);
  }

  // ── Image upload ──────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadError("");
    const toAdd = files.slice(0, 3 - pendingFiles.length);
    setPendingFiles((prev) => [
      ...prev,
      ...toAdd.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const continueFromUpload = async (goToKey: string) => {
    setUploadError("");
    setUploading(true);
    const uploadedUrls: string[] = [];
    for (const { file } of pendingFiles) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res  = await fetch("/api/reference-upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!json.ok || !json.url) throw new Error(json.error || "Upload failed");
        uploadedUrls.push(json.url as string);
      } catch (err) {
        console.error("[reference-upload]", err);
        setUploadError("One or more images failed to upload. Please try again.");
        setUploading(false);
        return;
      }
    }
    setAnswers((a) => ({ ...a, referenceImages: uploadedUrls }));
    setUploading(false);
    navigateTo(goToKey);
  };

  const continueFromDescribe = (goToKey: string) => {
    setAnswers((a) => ({ ...a, description: describeText }));
    navigateTo(goToKey);
  };

  // ── Lead submission ───────────────────────────────────────────────────────

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const lines = [
      `Occasion: ${answers.occasion}`,
      `Product: ${answers.product}`,
      `Budget: ${answers.budget}`,
      `Preference: ${answers.preference}`,
      answers.description ? `Vision: ${answers.description}` : "",
      answers.referenceImages.length
        ? `Reference images:\n${answers.referenceImages.join("\n")}`
        : "",
      `City: ${contact.city}`,
    ].filter(Boolean);
    pixel.leadSubmitted(answers.product, answers.budget);
    try {
      await fetch("/api/chat-leads", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contact,
          summary:         lines.join("\n"),
          referenceImages: answers.referenceImages,
          leadSource:      "design-advisor",
        }),
      });
    } catch (err) {
      console.error("[design] lead submit error", err);
    }
    setSubmitted(true);
    setSubmitting(false);
  };

  // ── WhatsApp URL ──────────────────────────────────────────────────────────

  const waNum  = whatsappNumber.replace(/[^0-9]/g, "");
  const name   = contact.name || "—";
  const base   =
    `Occasion: ${answers.occasion}\n` +
    `Product: ${answers.product}\n` +
    `Budget: ${answers.budget}`;

  const buildWaText = (): string => {
    switch (answers.waStyle) {
      case "reference": {
        const imgs = answers.referenceImages.length
          ? `\n\nMy reference images:\n${answers.referenceImages.map((u) => `🔗 ${u}`).join("\n")}`
          : "";
        return `Hi The Dazzlez! I have a reference image for the piece I want to create.\n\n${base}${imgs}\n\nMy name is ${name}. Looking forward to creating something beautiful together! ✨`;
      }
      case "expert":
        return `Hi The Dazzlez! I'm looking for your expert eye on this. 🎨\n\n${base}\n\nI'd love for your team to suggest the perfect piece based on my requirements. Please share your best recommendations!\n\nMy name is ${name}.`;
      case "describe":
        return `Hi The Dazzlez! I have something specific in mind. 💬\n\n${base}\n\nMy vision: ${answers.description || "—"}\n\nCan't wait to see what you suggest! My name is ${name}.`;
      default:
        return answers.preferChat
          ? `Hi The Dazzlez! I'd like to chat about finding the perfect piece.\n\n${base}\n\nMy name is ${name}. When can we connect?`
          : `Hi The Dazzlez! I just used your Design Advisor.\n\n${base}\nPreference: ${answers.preference}\n\nMy name is ${name}. I'd love to connect! ✨`;
    }
  };

  const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(buildWaText())}`;

  // ── Determine current flow step ───────────────────────────────────────────

  const isResults = currentStepKey === STEP_RESULTS;
  const isContact = currentStepKey === STEP_CONTACT;
  const flowStep: FlowStep | undefined = config.steps.find(
    (s) => s.stepKey === currentStepKey,
  );

  // ── Render a choice step ──────────────────────────────────────────────────

  const renderChoiceStep = (step: ChoiceStep) => (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl text-navy mb-1">{step.questionText}</h2>
      <p className="text-muted text-sm mb-7">{step.subtitle}</p>
      <div className={step.options.length <= 3 ? "flex flex-col gap-3" : "flex flex-wrap gap-3"}>
        {step.options.map((o) => (
          <ChoiceButton
            key={o.label}
            emoji={o.emoji}
            label={o.label}
            onClick={() => handleOptionPick(step, o)}
            dashed={o.behavior === "prefer-chat"}
          />
        ))}
      </div>
    </div>
  );

  // ── Render a describe step ────────────────────────────────────────────────

  const renderDescribeStep = (step: DescribeStep) => (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl text-navy mb-1">{step.questionText}</h2>
      <p className="text-muted text-sm mb-7">{step.subtitle}</p>

      <textarea
        value={describeText}
        onChange={(e) => setDescribeText(e.target.value)}
        placeholder={step.placeholder}
        rows={5}
        className="w-full border border-navy/15 rounded-2xl px-4 py-3 text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none bg-white"
      />

      {step.hints.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {step.hints.map((hint) => (
            <button key={hint} type="button"
              onClick={() => setDescribeText((t) => t ? `${t}, ${hint}` : hint)}
              className="text-xs text-navy/60 bg-white border border-navy/10 px-3 py-1 rounded-full hover:border-gold hover:text-gold transition-colors">
              {hint}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => continueFromDescribe(step.goToStepKey)}
        disabled={!describeText.trim()}
        className="mt-7 bg-gold text-navy text-sm font-medium px-8 py-3 rounded-full hover:bg-gold/90 transition-colors disabled:opacity-40">
        Continue →
      </button>
    </div>
  );

  // ── Render an upload step ─────────────────────────────────────────────────

  const renderUploadStep = (step: UploadStep) => (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl text-navy mb-1">{step.questionText}</h2>
      <p className="text-muted text-sm mb-7">{step.subtitle}</p>

      <button type="button" onClick={() => fileInputRef.current?.click()}
        disabled={pendingFiles.length >= 3}
        className={[
          "w-full border-2 border-dashed rounded-2xl p-8 text-center transition-colors",
          pendingFiles.length >= 3
            ? "border-navy/10 bg-navy/5 cursor-not-allowed"
            : "border-navy/20 hover:border-gold hover:bg-gold/5 cursor-pointer",
        ].join(" ")}>
        <p className="text-3xl mb-2">📎</p>
        <p className="text-sm font-medium text-navy">
          {pendingFiles.length >= 3 ? "Maximum 3 images" : "Tap to choose images"}
        </p>
        <p className="text-xs text-muted mt-1">JPEG, PNG, WebP · max 5 MB each</p>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {pendingFiles.length > 0 && (
        <div className="flex gap-3 mt-4 flex-wrap">
          {pendingFiles.map((item, i) => (
            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-cream-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt={`Reference ${i + 1}`}
                className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeFile(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-navy/70 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                aria-label="Remove">✕</button>
            </div>
          ))}
        </div>
      )}

      {uploadError && <p className="mt-3 text-sm text-red-600">{uploadError}</p>}

      <div className="flex items-center gap-3 mt-7 flex-wrap">
        <button type="button" onClick={() => navigateTo(step.goToStepKey)}
          className="text-sm text-muted hover:text-navy transition-colors">
          Skip for now →
        </button>
        {pendingFiles.length > 0 && (
          <button type="button"
            onClick={() => continueFromUpload(step.goToStepKey)}
            disabled={uploading}
            className="ml-auto bg-gold text-navy text-sm font-medium px-6 py-2.5 rounded-full hover:bg-gold/90 transition-colors disabled:opacity-60">
            {uploading
              ? "Uploading…"
              : `Continue with ${pendingFiles.length} image${pendingFiles.length > 1 ? "s" : ""} →`}
          </button>
        )}
      </div>
    </div>
  );

  // ── Render current step ───────────────────────────────────────────────────

  const renderCurrentStep = () => {
    if (!flowStep) {
      return (
        <div className="text-center py-8">
          <p className="text-muted text-sm">
            Flow configuration error — step &ldquo;{currentStepKey}&rdquo; not found.
          </p>
          <button type="button" onClick={resetFlow}
            className="mt-4 text-sm text-gold hover:underline">
            Start over
          </button>
        </div>
      );
    }
    switch (flowStep.kind) {
      case "choice":  return renderChoiceStep(flowStep);
      case "describe": return renderDescribeStep(flowStep);
      case "upload":   return renderUploadStep(flowStep);
      default:         return null;
    }
  };

  // ── Product filters ───────────────────────────────────────────────────────

  const productFilters: CollectionFilters = {
    minPrice: answers.minPrice > 0 ? answers.minPrice : undefined,
    maxPrice: answers.maxPrice > 0 ? answers.maxPrice : undefined,
  };

  // ── Progress bar sizing ───────────────────────────────────────────────────
  // Use history depth as progress. Always show at least 4 segments total.
  const progressCurrent = history.length;
  const progressTotal   = Math.max(4, history.length + 2);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-cream min-h-screen">
      {!isResults && !isContact ? (
        /* ── QUESTIONNAIRE ── */
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 min-h-[calc(100vh-80px)] flex flex-col justify-center">
          <p className="eyebrow text-gold mb-6">✦ Design Advisor</p>
          <ProgressBar current={progressCurrent} total={progressTotal} />

          {renderCurrentStep()}

          {history.length > 0 && (
            <button type="button" onClick={back}
              className="mt-10 text-sm text-muted hover:text-navy transition-colors self-start">
              ← Back
            </button>
          )}
        </div>
      ) : (
        /* ── RESULTS / CONTACT ── */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* Summary bar */}
          <div className="mb-8">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <p className="eyebrow text-gold">✦ Your Results</p>
              <button type="button" onClick={resetFlow}
                className="text-xs text-muted hover:text-navy transition-colors underline underline-offset-2">
                Start over
              </button>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-navy">
              {answers.preferChat || isContact
                ? "Let's find your perfect piece together"
                : `Matching ${answers.product || "jewellery"} for you`}
            </h2>
            {!answers.preferChat && !isContact && (
              <p className="text-sm text-muted mt-1">
                {[answers.occasion, answers.budget, answers.preference].filter(Boolean).join(" · ")}
                {answers.description &&
                  ` · "${answers.description.slice(0, 60)}${answers.description.length > 60 ? "…" : ""}"`}
              </p>
            )}
            {answers.referenceImages.length > 0 && (
              <div className="flex gap-2 mt-3">
                {answers.referenceImages.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Reference ${i + 1}`}
                      className="w-14 h-14 object-cover rounded-lg border border-cream-200 hover:opacity-90 transition-opacity" />
                  </a>
                ))}
                <span className="self-center text-xs text-muted ml-1">
                  reference image{answers.referenceImages.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {answers.preferChat || isContact ? (
            <div className="max-w-md mx-auto">
              <p className="text-sm text-muted mb-6 text-center">
                Fill in your details and our advisor will reach out on WhatsApp.
              </p>
              <ContactSidebar
                whatsappUrl={waUrl}
                onSubmit={submitLead}
                submitting={submitting}
                submitted={submitted}
                contact={contact}
                setContact={setContact}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
              <div className="lg:col-span-2">
                <ChatbotResults
                  category={answers.category}
                  filters={productFilters}
                  productLabel={answers.product || "jewellery"}
                  budgetLabel={answers.budget}
                />
              </div>
              <div className="lg:col-span-1 lg:sticky lg:top-8">
                <ContactSidebar
                  whatsappUrl={waUrl}
                  onSubmit={submitLead}
                  submitting={submitting}
                  submitted={submitted}
                  contact={contact}
                  setContact={setContact}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
