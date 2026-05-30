import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * POST /api/orders/webhook
 *
 * Cashfree server-side webhook — the most reliable payment confirmation path.
 * Cashfree calls this URL for PAYMENT_SUCCESS, PAYMENT_FAILURE, etc.
 *
 * Configure in Cashfree dashboard:
 *   Webhook URL: https://yourdomain.com/api/orders/webhook
 *   Version: 2023-08-01
 *
 * Validates the x-webhook-signature header before processing.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp  = req.headers.get("x-webhook-timestamp") || "";
    const secret     = process.env.CASHFREE_WEBHOOK_SECRET || "";

    // ── Verify signature ────────────────────────────────────────────────
    if (secret) {
      const signedPayload = `${timestamp}${rawBody}`;
      const expectedSig   = createHmac("sha256", secret)
        .update(signedPayload)
        .digest("base64");
      if (expectedSig !== signature) {
        console.warn("[webhook] Invalid Cashfree signature");
        return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = JSON.parse(rawBody) as any;
    const type  = event?.type as string;          // e.g. "PAYMENT_SUCCESS_WEBHOOK"
    const data  = event?.data as Record<string, unknown>;

    // Only handle payment events
    if (!type?.startsWith("PAYMENT_")) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderId = (data?.order as any)?.order_id as string | undefined;
    if (!orderId) {
      return NextResponse.json({ ok: true, skipped: "no order_id" });
    }

    const isSuccess = type === "PAYMENT_SUCCESS_WEBHOOK";
    const paymentStatus = isSuccess ? "captured" : "failed";

    const payload = await getPayload({ config });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (payload as any).find({
      collection: "orders",
      where: { orderId: { equals: orderId } },
      limit: 1,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = res?.docs?.[0] as any;

    if (!doc) {
      console.warn("[webhook] Order not found:", orderId);
      return NextResponse.json({ ok: true, skipped: "order not found" });
    }

    // Avoid downgrading a captured order
    if (doc.paymentStatus === "captured" && paymentStatus === "failed") {
      return NextResponse.json({ ok: true, skipped: "already captured" });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).update({
      collection: "orders",
      id: doc.id,
      overrideAccess: true,
      data: {
        paymentStatus,
        fulfillmentStatus: isSuccess ? "confirmed" : doc.fulfillmentStatus,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cashfreePaymentId: (data?.payment as any)?.cf_payment_id ?? "",
      },
    });

    console.log(`[webhook] Order ${orderId} → ${paymentStatus}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/orders/webhook]", err);
    // Return 200 to prevent Cashfree from retrying for non-transient errors
    return NextResponse.json({ ok: false, error: String(err) }, { status: 200 });
  }
}
