"use client";

/**
 * /checkout/callback
 *
 * Cashfree redirects here after the customer completes (or abandons) payment.
 * URL shape: /checkout/callback?order_id=DZ-2025-12345
 *
 * Next.js requires useSearchParams() to be inside a <Suspense> boundary, so
 * the real logic lives in <CallbackInner> and the default export wraps it.
 *
 * Flow:
 *  1. Read order_id from search params
 *  2. Call POST /api/orders/verify to fetch status from Cashfree + update Payload
 *  3. If captured  → clear cart, redirect to /order-confirmation/[orderId]
 *  4. If pending   → show "payment pending" state
 *  5. If failed    → show failure with retry option
 */

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackPurchase } from "@/lib/analytics/track";

type VerifyResult = {
  ok: boolean;
  paymentStatus?: "captured" | "pending" | "failed";
  orderId?: string;
  customerName?: string;
  totalInr?: number;
  error?: string;
};

function clearCart() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("dazzlez_cart");
  }
}

// ── Loading fallback (also shown while Suspense resolves) ────────────────────
function VerifyingState() {
  return (
    <div className="bg-cream min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mb-6" />
      <h1 className="font-display text-2xl text-navy mb-2">Verifying your payment…</h1>
      <p className="text-muted text-sm">Please don&apos;t close this tab.</p>
    </div>
  );
}

// ── Inner component — uses useSearchParams so must be inside Suspense ─────────
function CallbackInner() {
  const router       = useRouter();
  const params       = useSearchParams();
  const orderId      = params.get("order_id") ?? "";
  const [status, setStatus] = useState<"verifying" | "pending" | "failed" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const verified = useRef(false); // prevent double-call in StrictMode

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      setErrorMsg("No order ID found in the URL.");
      return;
    }
    if (verified.current) return;
    verified.current = true;

    (async () => {
      try {
        const res  = await fetch("/api/orders/verify", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ orderId }),
        });
        const data = (await res.json()) as VerifyResult;

        if (!res.ok || !data.ok) {
          setStatus("error");
          setErrorMsg(data.error || "Verification failed.");
          return;
        }

        if (data.paymentStatus === "captured") {
          // Track Purchase event
          trackPurchase(data.orderId || orderId, data.totalInr || 0, []);
          clearCart();
          router.replace(`/order-confirmation/${orderId}`);
          return;
        }

        if (data.paymentStatus === "pending") {
          setStatus("pending");
          return;
        }

        setStatus("failed");
      } catch (err) {
        console.error("[callback]", err);
        setStatus("error");
        setErrorMsg("Something went wrong while verifying your payment.");
      }
    })();
  }, [orderId, router]);

  /* ── Verifying ── */
  if (status === "verifying") {
    return <VerifyingState />;
  }

  /* ── Pending ── */
  if (status === "pending") {
    return (
      <div className="bg-cream min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-4xl mb-4">⏳</p>
        <h1 className="font-display text-2xl text-navy mb-2">Payment is pending</h1>
        <p className="text-muted text-sm max-w-sm mb-6">
          Your payment hasn&apos;t been confirmed yet. This sometimes happens with UPI or Net Banking.
          We&apos;ll send you a WhatsApp message once it clears (usually within a few minutes).
        </p>
        <p className="text-xs text-muted mb-8">
          Order ID: <span className="font-medium text-navy">{orderId}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`https://wa.me/919829115205?text=${encodeURIComponent(
              `Hi! My payment for order ${orderId} seems to be pending. Can you help?`
            )}`}
            target="_blank" rel="noopener noreferrer"
            className="bg-[#25D366] text-white font-medium px-8 py-3 rounded-full text-sm hover:bg-[#22c35e] transition-colors">
            Message us on WhatsApp
          </a>
          <Link href="/"
            className="border border-navy/20 text-navy font-medium px-8 py-3 rounded-full text-sm hover:border-gold hover:text-gold transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  /* ── Failed ── */
  if (status === "failed") {
    return (
      <div className="bg-cream min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-4xl mb-4">❌</p>
        <h1 className="font-display text-2xl text-navy mb-2">Payment unsuccessful</h1>
        <p className="text-muted text-sm max-w-sm mb-8">
          Your payment could not be processed. Your cart has been saved — try again or reach us on WhatsApp.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/checkout"
            className="bg-gold text-navy font-semibold px-8 py-3 rounded-full text-sm hover:bg-gold/90 transition-colors">
            Try Again
          </Link>
          <a
            href={`https://wa.me/919829115205?text=${encodeURIComponent(
              `Hi! My payment for order ${orderId} failed. Can you help me place the order?`
            )}`}
            target="_blank" rel="noopener noreferrer"
            className="bg-[#25D366] text-white font-medium px-8 py-3 rounded-full text-sm hover:bg-[#22c35e] transition-colors">
            Chat on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  return (
    <div className="bg-cream min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-4xl mb-4">⚠️</p>
      <h1 className="font-display text-2xl text-navy mb-2">Something went wrong</h1>
      <p className="text-muted text-sm max-w-sm mb-4">{errorMsg}</p>
      <p className="text-xs text-muted mb-8">
        If your payment was deducted, please contact us immediately on WhatsApp with your order details.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={`https://wa.me/919829115205?text=${encodeURIComponent(
            `Hi! I have an issue with my order${orderId ? ` ${orderId}` : ""}. Please help.`
          )}`}
          target="_blank" rel="noopener noreferrer"
          className="bg-[#25D366] text-white font-medium px-8 py-3 rounded-full text-sm hover:bg-[#22c35e] transition-colors">
          Contact Support
        </a>
        <Link href="/"
          className="border border-navy/20 text-navy font-medium px-8 py-3 rounded-full text-sm hover:border-gold hover:text-gold transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

// ── Page export — wraps inner component in Suspense (required by Next.js) ─────
export default function CheckoutCallbackPage() {
  return (
    <Suspense fallback={<VerifyingState />}>
      <CallbackInner />
    </Suspense>
  );
}
