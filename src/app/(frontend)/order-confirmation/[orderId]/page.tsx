/**
 * /order-confirmation/[orderId]
 *
 * Celebration page shown after a successful Cashfree payment.
 * Data is fetched server-side from Payload (no client secrets exposed).
 *
 * Sections:
 *  - Celebration hero (order ID, customer name, total)
 *  - Ordered items summary
 *  - "What happens next" timeline (MTO → QC → dispatch)
 *  - WhatsApp CTA (pre-filled order summary)
 *  - Browse / Home links
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";

export const revalidate = 60; // ISR – confirmation rarely changes after creation

type OrderItem = {
  productCode:  string;
  displayName:  string;
  qty:          number;
  metal:        string;
  goldColor?:   string;
  diamondTier?: string;
  ringSize?:    string;
  caratWeight?: string;
  engraving?:   string;
  unitPriceInr: number;
};

type OrderDoc = {
  orderId:           string;
  customerName:      string;
  customerPhone:     string;
  customerEmail:     string;
  paymentStatus:     string;
  fulfillmentStatus: string;
  items:             OrderItem[];
  subtotalInr:       number;
  gstInr:            number;
  totalInr:          number;
  orderNotes?:       string;
};

async function getOrder(orderId: string): Promise<OrderDoc | null> {
  try {
    const payload = await getPayload({ config });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (payload as any).find({
      collection: "orders",
      where:      { orderId: { equals: orderId } },
      limit:      1,
      depth:      0,
    });
    return (res?.docs?.[0] as OrderDoc) ?? null;
  } catch {
    return null;
  }
}

function formatInr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function buildWaMessage(order: OrderDoc): string {
  const lines = [
    `Hi The Dazzlez! 🙏 I just placed order *${order.orderId}*.`,
    "",
    "*Items ordered:*",
    ...order.items.map(
      (it) =>
        `• ${it.displayName} (${it.metal}${it.diamondTier ? `, ${it.diamondTier}` : ""}${it.ringSize ? `, Size ${it.ringSize}` : ""}${it.caratWeight ? `, ${it.caratWeight}ct` : ""}) × ${it.qty}`,
    ),
    "",
    `*Total paid:* ${formatInr(order.totalInr)}`,
    "",
    "Looking forward to receiving my piece! Please keep me updated on the crafting progress.",
  ];
  return lines.join("\n");
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: { orderId: string };
}) {
  const order = await getOrder(params.orderId);

  if (!order || order.paymentStatus !== "captured") {
    notFound();
  }

  const waText = buildWaMessage(order);
  const waLink = `https://wa.me/919829115205?text=${encodeURIComponent(waText)}`;

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">

        {/* ── Hero ── */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">💍</div>
          <h1 className="font-display text-4xl text-navy mb-2">Order Confirmed!</h1>
          <p className="text-muted text-base">
            Thank you, <strong className="text-navy">{order.customerName}</strong>. Your piece is now in the queue.
          </p>
          <div className="inline-block mt-4 px-5 py-2 bg-white border border-cream-200 rounded-full text-sm text-navy shadow-sm">
            Order ID: <span className="font-semibold text-gold">{order.orderId}</span>
          </div>
        </div>

        {/* ── Items ── */}
        <div className="bg-white border border-cream-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-display text-lg text-navy mb-4">Your Order</h2>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-navy">{item.displayName}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {[
                      item.metal,
                      item.diamondTier,
                      item.ringSize && `Size ${item.ringSize}`,
                      item.caratWeight && `${item.caratWeight}ct`,
                      item.goldColor,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {item.engraving && (
                    <p className="text-xs text-muted mt-0.5">Engraving: &ldquo;{item.engraving}&rdquo;</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-navy font-medium">{formatInr(item.unitPriceInr * item.qty)}</p>
                  {item.qty > 1 && (
                    <p className="text-xs text-muted">{formatInr(item.unitPriceInr)} × {item.qty}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-cream-200 space-y-1 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal (excl. GST)</span>
              <span>{formatInr(order.subtotalInr)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>GST (3%)</span>
              <span>{formatInr(order.gstInr)}</span>
            </div>
            <div className="flex justify-between font-semibold text-navy text-base pt-1">
              <span>Total Paid</span>
              <span>{formatInr(order.totalInr)}</span>
            </div>
          </div>
        </div>

        {/* ── What happens next ── */}
        <div className="bg-white border border-cream-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-display text-lg text-navy mb-5">What happens next?</h2>
          <ol className="space-y-5">
            {[
              {
                icon: "✉️",
                title: "Order confirmation",
                desc: "You'll receive a WhatsApp message from our team within 2 hours confirming your order details.",
                time: "Today",
              },
              {
                icon: "🔨",
                title: "Crafting begins",
                desc: "Our artisans start working on your piece. Made-to-order jewellery takes 15–21 days to craft.",
                time: "Days 1–21",
              },
              {
                icon: "🔍",
                title: "Quality check",
                desc: "Every piece goes through a multi-point quality inspection and photographed for your approval.",
                time: "Day 21–22",
              },
              {
                icon: "🚚",
                title: "Dispatch & delivery",
                desc: "Shipped via insured courier with real-time tracking. Estimated 2–3 business days after dispatch.",
                time: "Day 23–26",
              },
            ].map((step, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="text-2xl">{step.icon}</div>
                  {i < 3 && <div className="w-px flex-1 bg-cream-200 mt-2" />}
                </div>
                <div className="pb-2">
                  <p className="font-medium text-navy text-sm">{step.title}</p>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{step.desc}</p>
                  <span className="inline-block mt-1 text-xs text-gold font-medium">{step.time}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ── WhatsApp CTA ── */}
        <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-6 mb-6 text-center">
          <p className="text-sm text-navy/80 mb-4 leading-relaxed">
            Get real-time updates from our artisans on WhatsApp — stone selection, casting, polishing and more.
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold px-8 py-3 rounded-full text-sm hover:bg-[#22c35e] transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Chat with our team →
          </a>
        </div>

        {/* ── Nav links ── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/collections/rings"
            className="border border-navy/20 text-navy font-medium px-8 py-3 rounded-full text-sm text-center hover:border-gold hover:text-gold transition-colors">
            Continue Browsing
          </Link>
          <Link
            href="/"
            className="border border-navy/20 text-navy font-medium px-8 py-3 rounded-full text-sm text-center hover:border-gold hover:text-gold transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
