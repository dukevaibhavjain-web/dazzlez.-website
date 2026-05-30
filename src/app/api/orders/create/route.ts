import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { loadRateSnapshot, computePriceFromSnapshot } from "@/lib/pricing/index";
import type { Purity, DiamondCategorySlug } from "@/lib/pricing/types";

/**
 * POST /api/orders/create
 *
 * 1. Validates the cart items against the live catalog
 * 2. Recomputes prices server-side (never trust client prices)
 * 3. Creates a Cashfree Order (gets payment_session_id)
 * 4. Saves a pending Orders document in Payload
 * 5. Returns the payment_session_id to the client
 *
 * Body: { items, customer, shippingAddress, orderNotes, gstInvoiceRequested }
 */

const CASHFREE_BASE =
  process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

function generateOrderId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `DZ-${year}-${rand}`;
}

type CartItem = {
  code: string;
  displayName: string;
  metal: string;
  goldColor: string;
  tier: string;        // "natural" | "lab-premium" | "lab-standard"
  size: string;
  carat: string;
  engraving: string;
  qty: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, customer, shippingAddress, orderNotes, gstInvoiceRequested } = body as {
      items: CartItem[];
      customer: { name: string; phone: string; email: string };
      shippingAddress: { line1: string; line2?: string; city: string; state: string; pincode: string };
      orderNotes?: string;
      gstInvoiceRequested?: boolean;
    };

    // ── Basic validation ────────────────────────────────────────────────
    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }
    if (!customer?.name || !customer?.phone || !customer?.email) {
      return NextResponse.json({ error: "Customer details are required." }, { status: 400 });
    }
    if (!shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.pincode) {
      return NextResponse.json({ error: "Shipping address is required." }, { status: 400 });
    }

    const payload = await getPayload({ config });

    // ── Load rate snapshot once ─────────────────────────────────────────
    const snapshot = await loadRateSnapshot(payload as Parameters<typeof loadRateSnapshot>[0]);

    // ── Compute prices server-side ──────────────────────────────────────
    let subtotalInr = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const computedItems: any[] = [];

    for (const item of items) {
      // Fetch product for pricing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productRes = await (payload as any).find({
        collection: "products",
        where: { code: { equals: item.code } },
        limit: 1,
        depth: 2,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const product = productRes?.docs?.[0] as any;
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.code} not found.` },
          { status: 400 },
        );
      }

      const breakup = computePriceFromSnapshot(snapshot, {
        product,
        metalPurity: (item.metal || "18K") as Purity,
        diamondCategorySlug: (item.tier || "natural") as DiamondCategorySlug,
        solitaireCarat: item.carat ? parseFloat(item.carat) : undefined,
        ringSize:       item.size  ? parseFloat(item.size)  : undefined,
      });

      const unitPrice = breakup.total;
      const lineTotal = unitPrice * (item.qty || 1);
      subtotalInr += lineTotal;

      computedItems.push({
        productCode:  item.code,
        displayName:  item.displayName,
        qty:          item.qty || 1,
        metal:        item.metal,
        goldColor:    item.goldColor,
        diamondTier:  item.tier,
        ringSize:     item.size,
        caratWeight:  item.carat,
        engraving:    item.engraving || "",
        unitPriceInr: unitPrice,
      });
    }

    // GST is already included in computePriceFromSnapshot totals (total = subtotal + gst)
    // For display, break out approx 3% GST component
    const gstInr = Math.round(subtotalInr * 3 / 103);
    const totalInr = subtotalInr;

    // ── Generate order ID ───────────────────────────────────────────────
    const dazzlezOrderId = generateOrderId();

    // ── Create Cashfree order ───────────────────────────────────────────
    const cfPayload = {
      order_id:       dazzlezOrderId,
      order_amount:   totalInr,
      order_currency: "INR",
      customer_details: {
        customer_id:    customer.email.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50),
        customer_name:  customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone.replace(/[^0-9+]/g, ""),
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/checkout/callback?order_id={order_id}`,
        notify_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/orders/webhook`,
      },
      order_note: orderNotes || "The Dazzlez order",
    };

    const cfRes = await fetch(`${CASHFREE_BASE}/orders`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id":   process.env.CASHFREE_APP_ID    || "",
        "x-client-secret": process.env.CASHFREE_SECRET_KEY || "",
      },
      body: JSON.stringify(cfPayload),
    });

    if (!cfRes.ok) {
      const err = await cfRes.text();
      console.error("[orders/create] Cashfree error:", err);
      return NextResponse.json(
        { error: "Payment gateway error. Please try again." },
        { status: 502 },
      );
    }

    const cfData = (await cfRes.json()) as { payment_session_id: string; order_id: string };

    // ── Save pending order in Payload ───────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).create({
      collection: "orders",
      overrideAccess: true,
      data: {
        orderId:           dazzlezOrderId,
        cashfreeOrderId:   cfData.order_id,
        paymentStatus:     "pending",
        fulfillmentStatus: "new",
        customerName:      customer.name,
        customerPhone:     customer.phone,
        customerEmail:     customer.email,
        shippingAddress: {
          line1:   shippingAddress.line1,
          line2:   shippingAddress.line2 || "",
          city:    shippingAddress.city,
          state:   shippingAddress.state,
          pincode: shippingAddress.pincode,
        },
        items:          computedItems,
        subtotalInr:    subtotalInr - gstInr,
        gstInr,
        totalInr,
        orderNotes:     orderNotes || "",
        gstInvoiceRequested: Boolean(gstInvoiceRequested),
      },
    });

    return NextResponse.json({
      ok:               true,
      orderId:          dazzlezOrderId,
      paymentSessionId: cfData.payment_session_id,
      totalInr,
    });
  } catch (err) {
    console.error("[POST /api/orders/create]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
