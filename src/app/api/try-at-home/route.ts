import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * POST /api/try-at-home
 * Public endpoint — creates a TryAtHomeLeads document from the PDP form.
 * No auth required; rate-limiting can be added via middleware if needed.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      productCode,
      productName,
    } = body as Record<string, string>;

    // Basic validation
    if (!customerName?.trim() || !phone?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: "Name, phone and address are required." },
        { status: 400 },
      );
    }

    const payload = await getPayload({ config });
    await payload.create({
      collection: "try-at-home-leads",
      overrideAccess: true,
      data: {
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        address: address.trim(),
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        productCode: productCode?.trim() || null,
        productName: productName?.trim() || null,
        status: "new",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    return NextResponse.json({
      ok: true,
      message:
        "Request received! Our team will call you within 24 hours to schedule a visit.",
    });
  } catch (err) {
    console.error("[POST /api/try-at-home]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
