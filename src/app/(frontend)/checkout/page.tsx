"use client";

/**
 * /checkout — Single-page checkout with Cashfree payment.
 *
 * Layout: Cart summary (left) | Contact + Shipping + Payment (right)
 *
 * Flow:
 *  1. Validates cart from localStorage
 *  2. Customer fills in contact + shipping address
 *  3. On "Pay Now", calls POST /api/orders/create to get payment_session_id
 *  4. Loads @cashfreepayments/cashfree-js and opens Cashfree checkout
 *  5. Cashfree redirects to /checkout/callback?order_id=DZ-xxxx
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CartItem = {
  code: string; displayName: string; metal: string; goldColor: string;
  tier: string; size: string; carat: string; engraving: string;
  qty: number; timestamp: number;
};

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("dazzlez_cart") || "[]"); } catch { return []; }
}

function formatInr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand",
  "West Bengal","Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry",
];

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted,  setMounted]  = useState(false);
  const [items,    setItems]    = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error,    setError]    = useState("");

  const [contact, setContact] = useState({
    name: "", phone: "", email: "",
  });
  const [shipping, setShipping] = useState({
    line1: "", line2: "", city: "", state: "", pincode: "",
  });
  const [orderNotes, setOrderNotes] = useState("");
  const [gstInvoice, setGstInvoice] = useState(false);

  useEffect(() => {
    setMounted(true);
    const cart = getCart();
    setItems(cart);
    if (!cart.length) router.replace("/cart");
  }, [router]);

  const inputCls = "w-full border border-navy/15 rounded-xl px-4 py-2.5 text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white";
  const labelCls = "block text-xs font-medium text-navy/70 mb-1";

  const handlePay = async () => {
    setError("");
    if (!contact.name.trim() || !contact.phone.trim() || !contact.email.trim()) {
      setError("Please fill in all contact details."); return;
    }
    if (!shipping.line1.trim() || !shipping.city.trim() || !shipping.state || !shipping.pincode.trim()) {
      setError("Please fill in your complete shipping address."); return;
    }
    setSubmitting(true);

    try {
      // 1. Create order server-side
      const createRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customer: contact,
          shippingAddress: shipping,
          orderNotes,
          gstInvoiceRequested: gstInvoice,
        }),
      });
      const createData = await createRes.json();
      if (!createData.ok) {
        setError(createData.error || "Could not create order. Please try again.");
        setSubmitting(false);
        return;
      }

      const { paymentSessionId } = createData as { paymentSessionId: string; orderId: string };

      // 2. Load Cashfree SDK dynamically (avoid bundling the SDK with the app)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cashfree: any;
      try {
        // @ts-expect-error dynamic import of Cashfree browser SDK
        const cfModule = await import("@cashfreepayments/cashfree-js");
        cashfree = await cfModule.load({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === "production"
            ? "production"
            : "sandbox",
        });
      } catch {
        setError("Payment gateway failed to load. Please try again.");
        setSubmitting(false);
        return;
      }

      // 3. Open Cashfree checkout
      cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self",
      });
      // Cashfree will redirect to the return_url configured in /api/orders/create
    } catch (err) {
      console.error("[checkout]", err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (!mounted) return null;
  if (!items.length) return null;

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-8 flex items-center gap-2">
          <Link href="/cart" className="hover:text-navy transition-colors">Cart</Link>
          <span>›</span>
          <span className="text-navy font-medium">Checkout</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* ── Left: Cart summary ── */}
          <div className="order-2 lg:order-1">
            <h2 className="font-display text-xl text-navy mb-4">Order Summary</h2>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="bg-white border border-cream-200 rounded-xl p-4 flex justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-navy">{item.displayName}</p>
                    <p className="text-xs text-muted mt-0.5 uppercase tracking-wide">{item.code}</p>
                    <p className="text-xs text-muted mt-1">
                      {[item.metal, item.tier, item.size && `Size ${item.size}`, item.carat && `${item.carat}ct`].filter(Boolean).join(" · ")}
                    </p>
                    {item.engraving && <p className="text-xs text-muted mt-0.5">Engraving: &ldquo;{item.engraving}&rdquo;</p>}
                  </div>
                  <span className="text-xs text-muted shrink-0">×{item.qty}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gold/10 border border-gold/20 rounded-xl text-sm text-navy/70 leading-relaxed">
              🔨 Most pieces are <strong className="text-navy">made to order</strong> in 15–21 days. You&apos;ll receive a WhatsApp update at each milestone.
            </div>
          </div>

          {/* ── Right: Contact + Shipping + Pay ── */}
          <div className="order-1 lg:order-2">
            <h2 className="font-display text-xl text-navy mb-6">Your Details</h2>

            {/* Contact */}
            <div className="space-y-3 mb-6">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input className={inputCls} placeholder="Priya Sharma" required
                  value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Phone *</label>
                  <input className={inputCls} placeholder="+91 98765 43210" type="tel" required
                    value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input className={inputCls} placeholder="priya@email.com" type="email" required
                    value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <h3 className="font-medium text-navy text-sm mb-3">Shipping Address</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className={labelCls}>Address Line 1 *</label>
                <input className={inputCls} placeholder="House / Flat / Floor, Street" required
                  value={shipping.line1} onChange={(e) => setShipping((s) => ({ ...s, line1: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Address Line 2</label>
                <input className={inputCls} placeholder="Area, Colony, Landmark (optional)"
                  value={shipping.line2} onChange={(e) => setShipping((s) => ({ ...s, line2: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>City *</label>
                  <input className={inputCls} placeholder="Jaipur" required
                    value={shipping.city} onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>State *</label>
                  <select className={inputCls} required
                    value={shipping.state} onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))}>
                    <option value="">Select</option>
                    {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Pincode *</label>
                  <input className={inputCls} placeholder="302001" maxLength={6} required
                    value={shipping.pincode} onChange={(e) => setShipping((s) => ({ ...s, pincode: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Order notes */}
            <div className="mb-4">
              <label className={labelCls}>Order Notes / Engraving Instructions</label>
              <textarea className={inputCls} rows={2}
                placeholder="Any special requests, engraving text, gift wrapping notes…"
                value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} />
            </div>

            {/* GST invoice checkbox */}
            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input type="checkbox" className="accent-gold w-4 h-4"
                checked={gstInvoice} onChange={(e) => setGstInvoice(e.target.checked)} />
              <span className="text-sm text-navy/70">I need a GST invoice (for business purchases)</span>
            </label>

            {/* Error */}
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Pay button */}
            <button
              type="button"
              onClick={handlePay}
              disabled={submitting}
              className="w-full bg-gold text-navy font-semibold py-4 rounded-full hover:bg-gold/90 transition-colors disabled:opacity-60 text-base">
              {submitting ? "Processing…" : "Pay Securely →"}
            </button>

            <p className="text-xs text-muted text-center mt-3">
              🔒 Powered by Cashfree · UPI, Net Banking, Cards, EMI accepted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
