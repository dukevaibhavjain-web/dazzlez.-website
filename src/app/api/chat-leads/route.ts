/**
 * POST /api/chat-leads
 * Saves a guided-chatbot lead to the Payload TryAtHomeLeads collection.
 */

import { getPayload } from "payload";
import configPromise from "@payload-config";

export async function POST(req: Request) {
  let body: {
    name: string;
    phone: string;
    email?: string;
    city?: string;
    summary: string;
    referenceImages?: string[];
    leadSource?: string;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const payload = await getPayload({ config: configPromise });
    await payload.create({
      collection: "try-at-home-leads",
      data: {
        customerName: body.name,
        phone: body.phone,
        email: body.email,
        address: body.city || "—",
        adminNotes: `[AI Chatbot Lead]\n${body.summary}`,
        leadSource: (body.leadSource ?? "design-advisor") as "design-advisor" | "ai-chat" | "try-at-home" | "other",
        referenceImages: (body.referenceImages ?? []).map((url) => ({ url })),
        status: "new",
      },
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[chat-leads]", err);
    return Response.json({ ok: false, error: "Failed to save" }, { status: 500 });
  }
}
