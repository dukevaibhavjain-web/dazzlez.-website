/**
 * chatbotConfig.ts — server-only Payload fetch for the ChatbotConfig global.
 *
 * ⚠️  Server-only: imports Payload + Node.js. Never import from "use client".
 *
 * Types and DEFAULT_FLOW_CONFIG live in chatbotConfigTypes.ts (client-safe).
 */

import { getPayload } from "payload";
import config from "@payload-config";
import type {
  FlowConfig,
  FlowStep,
  ChoiceStep,
  DescribeStep,
  UploadStep,
  ChoiceOption,
} from "./chatbotConfigTypes";
import { DEFAULT_FLOW_CONFIG } from "./chatbotConfigTypes";

// Re-export everything so callers can use a single import path if they prefer
export type {
  FlowConfig,
  FlowStep,
  ChoiceStep,
  DescribeStep,
  UploadStep,
  ChoiceOption,
} from "./chatbotConfigTypes";
export { DEFAULT_FLOW_CONFIG, STEP_RESULTS, STEP_CONTACT } from "./chatbotConfigTypes";

// ── Helpers ───────────────────────────────────────────────────────────────────

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" ? v : fallback;
}

// ── Fetch + normalise ─────────────────────────────────────────────────────────

export async function getChatbotConfig(): Promise<FlowConfig> {
  const D = DEFAULT_FLOW_CONFIG;
  try {
    const payload = await getPayload({ config });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = (await (payload as any).findGlobal({ slug: "chatbot-config" })) as any;
    if (!doc) return D;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawSteps = arr<any>(doc.steps);
    if (!rawSteps.length) return D;

    const steps: FlowStep[] = rawSteps
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((block: any): FlowStep | null => {
        switch (block.blockType) {
          case "choiceStep": {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const opts = arr<any>(block.options).map((o: any): ChoiceOption => ({
              label:        str(o.label,       "Option"),
              emoji:        str(o.emoji,       "") || undefined,
              goToStepKey:  str(o.goToStepKey, "__results__"),
              categorySlug: typeof o.categorySlug === "string" ? o.categorySlug || undefined : undefined,
              minPrice:     num(o.minPrice, 0),
              maxPrice:     num(o.maxPrice, 0),
              behavior:     o.behavior === "prefer-chat" ? "prefer-chat" : "normal",
              waStyle: (["standard", "reference", "expert", "describe"].includes(o.waStyle)
                ? o.waStyle
                : "standard") as ChoiceOption["waStyle"],
              pixelEvent:  typeof o.pixelEvent  === "string" && o.pixelEvent  ? o.pixelEvent  : undefined,
              pixelParams: typeof o.pixelParams === "string" && o.pixelParams ? o.pixelParams : undefined,
            }));
            return {
              kind:         "choice",
              stepKey:      str(block.stepKey,      "step"),
              questionText: str(block.questionText, ""),
              subtitle:     str(block.subtitle,     ""),
              options:      opts.length
                ? opts
                : [{ label: "Continue", goToStepKey: "__results__" }],
            } satisfies ChoiceStep;
          }

          case "describeStep": {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const hints = arr<any>(block.hints)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((h: any) => str(h.label, ""))
              .filter(Boolean);
            return {
              kind:         "describe",
              stepKey:      str(block.stepKey,      "describe"),
              questionText: str(block.questionText, "Describe your vision"),
              subtitle:     str(block.subtitle,     ""),
              placeholder:  str(block.placeholder,  ""),
              hints,
              goToStepKey:  str(block.goToStepKey,  "__results__"),
            } satisfies DescribeStep;
          }

          case "uploadStep": {
            return {
              kind:         "upload",
              stepKey:      str(block.stepKey,      "upload"),
              questionText: str(block.questionText, "Upload your reference"),
              subtitle:     str(block.subtitle,     ""),
              goToStepKey:  str(block.goToStepKey,  "__results__"),
            } satisfies UploadStep;
          }

          default:
            return null;
        }
      })
      .filter((s): s is FlowStep => s !== null);

    if (!steps.length) return D;

    return {
      entryStepKey: str(doc.entryStepKey, D.entryStepKey),
      steps,
    };
  } catch {
    return D;
  }
}
