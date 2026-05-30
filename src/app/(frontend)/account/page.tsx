"use client";

/**
 * /account — Customer account dashboard.
 *
 * Uses Payload's built-in /api/customers/me endpoint to check session.
 * Redirects to /login if no active session.
 *
 * Sub-sections:
 *  - Profile (name, email, phone)
 *  - Orders (links through to /account/orders)
 *  - WhatsApp opt-in notice
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Customer = {
  id: string;
  email: string;
  name?: string;
};

type Order = {
  orderId:           string;
  totalInr:          number;
  paymentStatus:     string;
  fulfillmentStatus: string;
  createdAt:         string;
  items:             { displayName: string; qty: number }[];
};

const STATUS_LABELS: Record<string, string> = {
  new:          "Received",
  confirmed:    "Confirmed",
  in_production:"In Production",
  ready:        "Ready to Ship",
  dispatched:   "Dispatched",
  delivered:    "Delivered",
  cancelled:    "Cancelled",
};

const PAYMENT_COLORS: Record<string, string> = {
  captured: "bg-green-100 text-green-800",
  pending:  "bg-amber-100 text-amber-800",
  failed:   "bg-red-100 text-red-800",
  refunded: "bg-blue-100 text-blue-800",
};

function formatInr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    // 1. Check session via Payload me endpoint
    fetch("/api/customers/me", { credentials: "include" })
      .then((r) => r.json())
      .then(async (data) => {
        if (!data?.user) {
          router.replace("/login");
          return;
        }
        setCustomer(data.user as Customer);

        // 2. Fetch orders for this customer
        const orderRes = await fetch(
          `/api/orders/mine?email=${encodeURIComponent(data.user.email)}`,
          { credentials: "include" },
        );
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrders(orderData.orders ?? []);
        }
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="bg-cream min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl text-navy mb-2">My Account</h1>
        <p className="text-muted text-sm mb-10">{customer.email}</p>

        {/* ── Recent Orders ── */}
        <section className="mb-10">
          <h2 className="font-display text-xl text-navy mb-4">Your Orders</h2>

          {orders.length === 0 ? (
            <div className="bg-white border border-cream-200 rounded-2xl p-8 text-center shadow-sm">
              <p className="text-muted text-sm mb-4">You haven&apos;t placed any orders yet.</p>
              <Link href="/collections/rings"
                className="inline-block bg-gold text-navy font-medium px-6 py-2.5 rounded-full text-sm hover:bg-gold/90 transition-colors">
                Browse Collections
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.orderId}
                  className="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-navy text-sm">{order.orderId}</p>
                      <p className="text-xs text-muted mt-0.5">{formatDate(order.createdAt)}</p>
                      <p className="text-xs text-muted mt-1">
                        {order.items.map((it) => `${it.displayName} ×${it.qty}`).join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-navy text-sm">{formatInr(order.totalInr)}</p>
                      <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${PAYMENT_COLORS[order.paymentStatus] ?? "bg-gray-100 text-gray-700"}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                  {order.fulfillmentStatus && (
                    <div className="mt-3 pt-3 border-t border-cream-200 flex items-center gap-2 text-xs text-muted">
                      <span className="w-2 h-2 rounded-full bg-gold shrink-0" />
                      {STATUS_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── WhatsApp notice ── */}
        <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-5 text-sm text-navy/80 leading-relaxed">
          <strong className="text-navy">Stay updated on WhatsApp.</strong> Our team sends you a personal
          message at every milestone — stone selection, casting, QC, and dispatch. You don&apos;t need to do anything; just reply to us any time.
        </div>
      </div>
    </div>
  );
}
