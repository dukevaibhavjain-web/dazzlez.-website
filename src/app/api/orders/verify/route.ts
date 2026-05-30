import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * POST /api/orders/verify
 *
 * Called by the checkout callback page after Cashfree redirects back.
 * Fetches the order status directly from Cashfree, then updates the
 * Payload Order document accordingly.
 *
 * Body: { orderId }  (our DZ-xxxx identifier, also the Cashfree order_id)
 */

const CASHFREE_BASE =
  process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = (await req.json()) as { orderId: string };

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required." }, { status: 400 });
    }

    // ── Fetch order status from Cashfree ────────────────────────────────
    const cfRes = await fetch(`${CASHFREE_BASE}/orders/${orderId}`, {
      headers: {
        "x-api-version":   "2023-08-01",
        "x-client-id":     process.env.CASHFREE_APP_ID     || "",
        "x-client-secret": process.env.CASHFREE_SECRET_KEY || "",
      },
    });

    if (!cfRes.ok) {
      return NextResponse.json({ error: "Could not verify payment." }, { status: 502 });
    }

    const cfOrder = (await cfRes.json()) as {
      order_status: string;
      cf_order_id?: string | number;
      order_id?: string;
    };

    const cfStatus = cfOrder.order_status?.toUpperCase();
    // Cashfree statuses: PAID, ACTIVE (pending), EXPIRED, CANCELLED
    const paymentStatus =
      cfStatus === "PAID"      ? "captured"
      : cfStatus === "ACTIVE"  ? "pending"
      : "failed";

    const payload = await getPayload({ config });

    // Find our Order document by orderId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (payload as any).find({
      collection: "orders",
      where: { orderId: { equals: orderId } },
      limit: 1,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = res?.docs?.[0] as any;

    if (!doc) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // ── Update payment status ───────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).update({
      collection: "orders",
      id: doc.id,
      overrideAccess: true,
      data: {
        paymentStatus,
        fulfillmentStatus: paymentStatus === "captured" ? "confirmed" : doc.fulfillmentStatus,
      },
    });

    return NextResponse.json({
      ok:            true,
      paymentStatus,
      orderId,
      customerName:  doc.customerName,
      totalInr:      doc.totalInr,
      items:         doc.items,
    });
  } catch (err) {
    console.error("[POST /api/orders/verify]", err);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
