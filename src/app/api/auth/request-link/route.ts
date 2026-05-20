import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import crypto from "crypto";

/**
 * POST /api/auth/request-link
 * Body: { email: string }
 *
 * Phase 0 magic-link flow:
 *   1. Find or create a customer for the email (random password — never shown).
 *   2. Trigger Payload's built-in forgot-password, which emails a reset token.
 *   3. The email goes through our console adapter, so in dev the link prints
 *      to the terminal where `pnpm dev` is running.
 *
 * Phase 1B will replace this with a true passwordless JWT flow + nicer UI.
 */
export async function POST(req: Request) {
  let email: string | undefined;
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined;
  } catch {
    /* fall through */
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  }

  const payload = await getPayload({ config });

  const found = await payload.find({
    collection: "customers",
    where: { email: { equals: email } },
    limit: 1,
  });

  if (found.totalDocs === 0) {
    await payload.create({
      collection: "customers",
      data: {
        email,
        password: crypto.randomBytes(32).toString("hex"),
        source: "web",
      },
    });
  }

  // Always return success — don't leak whether the email is registered.
  // Errors during forgotPassword (e.g. email send) are logged server-side.
  try {
    await payload.forgotPassword({
      collection: "customers",
      data: { email },
    });
  } catch (err) {
    console.error("[request-link] forgotPassword failed:", err);
  }

  return NextResponse.json({ ok: true });
}
