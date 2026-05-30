/**
 * POST /api/chat
 *
 * Streaming SSE endpoint for the AI jewelry advisor chatbot.
 * Uses Claude with two tools:
 *   - search_products   → calls getProductsForCategory + filters
 *   - escalate_to_human → saves Payload CRM lead + returns WhatsApp URL
 *
 * SSE event format:
 *   data: {"type":"text","delta":"..."}
 *   data: {"type":"tool_result","toolName":"search_products","products":[...],"total":N}
 *   data: {"type":"tool_result","toolName":"escalate_to_human","whatsappUrl":"...","summary":"..."}
 *   data: [DONE]
 */

import Anthropic from "@anthropic-ai/sdk";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { getProductsForCategory } from "@/lib/storefront/catalog";
import type { CollectionFilters, Purity } from "@/lib/storefront/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Increase timeout for streaming responses
export const maxDuration = 60;

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a warm, knowledgeable jewelry advisor for The Dazzlez — "Pure & Guilt Free Jewelry."
We sell certified lab-grown and natural diamond jewelry: rings, earrings, necklaces, and bracelets. All pieces are BIS-hallmarked and priced in INR.

Your goal: help the customer find their perfect piece in 3–6 conversational turns.

Step 1 — Acknowledge their opening message warmly. Ask 1–2 focused clarifying questions.
Step 2 — Gather enough information: jewelry type (rings/earrings/necklaces/bracelets), occasion or purpose, metal preference (gold/silver/platinum), budget in INR, and whether they prefer lab-grown or natural diamonds.
Step 3 — Once you have enough information (at minimum: jewelry type and rough budget), call search_products.
Step 4 — Present the results conversationally: mention the product name, why it matches their needs, and the starting price. If there are results, highlight the best 1–2 options.
Step 5 — If search returns 0 results or the customer has very specific/complex requirements, call escalate_to_human with a clear summary.

Rules:
- Keep every response to 2–3 short sentences. This is a chat widget — brevity is key.
- Never mention competitors.
- Format all prices as ₹X,XX,XXX (Indian number format).
- Do not ask for personal contact details — the escalation flow handles that separately.
- If the customer asks to speak to a person at any time, call escalate_to_human immediately.`;

// ── Tool definitions ─────────────────────────────────────────────────────────
const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_products",
    description:
      "Search The Dazzlez catalog for matching jewelry products. Call this when you have gathered the customer's jewelry type and budget. Returns up to 4 matching products.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          enum: ["rings", "earrings", "necklaces", "bracelets"],
          description: "Jewelry category to search in.",
        },
        metals: {
          type: "array",
          items: {
            type: "string",
            enum: ["9K", "14K", "18K", "22K", "Silver925", "Platinum"],
          },
          description: "Customer's metal preference(s). Leave empty for no filter.",
        },
        minPrice: {
          type: "number",
          description: "Minimum budget in INR.",
        },
        maxPrice: {
          type: "number",
          description: "Maximum budget in INR.",
        },
        shape: {
          type: "string",
          description:
            "Diamond/stone shape slug if specified, e.g. 'round', 'oval', 'solitaire'.",
        },
        inStock: {
          type: "boolean",
          description: "Set true to return only ready-to-ship pieces.",
        },
      },
      required: ["category"],
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Escalate to a human jewelry advisor when no products match, requirements are very custom, or the customer explicitly asks to speak to a person. Always call this instead of saying 'I can't help.'",
    input_schema: {
      type: "object" as const,
      properties: {
        reason: {
          type: "string",
          description: "Why escalation is needed (for internal logging).",
        },
        summary: {
          type: "string",
          description:
            "A concise summary of the conversation and the customer's requirements, written for the human advisor who will read it on WhatsApp.",
        },
      },
      required: ["reason", "summary"],
    },
  },
];

// ── Tool implementations ─────────────────────────────────────────────────────
type SearchInput = {
  category: string;
  metals?: string[];
  minPrice?: number;
  maxPrice?: number;
  shape?: string;
  inStock?: boolean;
};

async function runSearchProducts(input: SearchInput) {
  const filters: CollectionFilters = {
    metals: input.metals as Purity[] | undefined,
    minPrice: input.minPrice,
    maxPrice: input.maxPrice,
    shape: input.shape,
    inStock: input.inStock,
  };
  const { products, total } = await getProductsForCategory(input.category, filters);
  return { products: products.slice(0, 4), total };
}

type EscalateInput = {
  reason: string;
  summary: string;
};

async function runEscalateToHuman(input: EscalateInput, whatsappNumber: string) {
  // Persist a CRM lead in Payload
  try {
    const payload = await getPayload({ config: configPromise });
    await payload.create({
      collection: "try-at-home-leads",
      data: {
        customerName: "AI Chat Lead",
        phone: "—",
        address: "AI Chat Escalation",
        adminNotes: `[AI Chatbot] ${input.reason}\n\n${input.summary}`,
        status: "new",
      },
    });
  } catch (err) {
    console.error("[chat] Failed to save escalation lead:", err);
  }

  const e164 = whatsappNumber.replace(/[^0-9]/g, "");
  const waText = encodeURIComponent(
    `Hi! I was chatting with the Dazzlez AI advisor and I need some help.\n\nHere's a summary of what I'm looking for:\n\n${input.summary}`,
  );
  return {
    whatsappUrl: `https://wa.me/${e164}?text=${waText}`,
    summary: input.summary,
  };
}

// ── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  let body: { messages: Anthropic.MessageParam[]; whatsappNumber?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { messages, whatsappNumber = "+919829115205" } = body;

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (payload: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

      // Mutable history that grows with each agentic loop turn
      const history: Anthropic.MessageParam[] = [...messages];
      let continueLoop = true;
      let loopCount = 0;

      try {
        while (continueLoop && loopCount < 6) {
          loopCount++;

          const stream = anthropic.messages.stream({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            tools: TOOLS,
            messages: history,
          });

          // Forward text deltas in real time
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              send({ type: "text", delta: event.delta.text });
            }
          }

          // Get the fully assembled message (includes complete tool inputs)
          const finalMsg = await stream.finalMessage();

          // Push assistant turn to history
          history.push({ role: "assistant", content: finalMsg.content });

          // Check for tool use
          const toolUses = finalMsg.content.filter(
            (b: Anthropic.ContentBlock): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          if (toolUses.length === 0 || finalMsg.stop_reason === "end_turn") {
            continueLoop = false;
          } else {
            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const toolUse of toolUses) {
              if (toolUse.name === "search_products") {
                const result = await runSearchProducts(toolUse.input as SearchInput);
                send({ type: "tool_result", toolName: "search_products", ...result });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(result),
                });
              } else if (toolUse.name === "escalate_to_human") {
                const result = await runEscalateToHuman(
                  toolUse.input as EscalateInput,
                  whatsappNumber,
                );
                send({ type: "tool_result", toolName: "escalate_to_human", ...result });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(result),
                });
              }
            }

            history.push({ role: "user", content: toolResults });
          }
        }
      } catch (err) {
        console.error("[chat] Streaming error:", err);
        send({ type: "error", message: "Something went wrong. Please try again." });
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
