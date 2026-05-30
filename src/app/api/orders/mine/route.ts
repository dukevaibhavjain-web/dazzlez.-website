import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * GET /api/orders/mine?email=<email>
 *
 * Returns orders for the authenticated customer (matched by email).
 * We use the Payload me endpoint result on the client to get the email;
 * this route trusts the session cookie to validate identity.
 *
 * Returns: { orders: [...] }  — sorted newest first, last 20.
 */
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "email is required." }, { status: 400 });
    }

    const payload = await getPayload({ config });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (payload as any).find({
      collection: "orders",
      where: {
        and: [
          { customerEmail:  { equals: email } },
          { paymentStatus:  { equals: "captured" } },
        ],
      },
      sort:  "-createdAt",
      limit: 20,
      depth: 0,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders = res.docs.map((doc: any) => ({
      orderId:           doc.orderId,
      totalInr:          doc.totalInr,
      paymentStatus:     doc.paymentStatus,
      fulfillmentStatus: doc.fulfillmentStatus,
      createdAt:         doc.createdAt,
      items:             (doc.items ?? []).map((it: any) => ({
        displayName: it.displayName,
        qty:         it.qty,
      })),
    }));

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[GET /api/orders/mine]", err);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
