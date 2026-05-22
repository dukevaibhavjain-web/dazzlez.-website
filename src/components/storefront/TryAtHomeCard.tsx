"use client";

import { useCallback, useState } from "react";

export type TryAtHomeSettings = {
  title: string;
  description: string;
  buttonText: string;
  imageUrl: string | null;
  disclaimer: string | null;
};

type FormData = {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

const EMPTY_FORM: FormData = {
  customerName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

export function TryAtHomeCard({
  settings,
  productCode,
  productName,
}: {
  settings: TryAtHomeSettings;
  productCode: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch("/api/try-at-home", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, productCode, productName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        setSuccess(true);
        setOpen(false);
        setForm(EMPTY_FORM);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setSubmitting(false);
      }
    },
    [form, productCode, productName],
  );

  return (
    <div className="mt-10 border border-cream-200 rounded-xl overflow-hidden shadow-sm">
      {/* Card header — image + content side by side */}
      <div className={`grid ${settings.imageUrl ? "sm:grid-cols-2" : ""}`}>
        {/* Lifestyle image */}
        {settings.imageUrl && (
          <div className="overflow-hidden max-h-60 sm:max-h-none bg-cream-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.imageUrl}
              alt={settings.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Text + CTA */}
        <div className="p-6 flex flex-col justify-center bg-cream-50/60">
          <p className="eyebrow mb-1 text-gold">Exclusive Service</p>
          <h3 className="font-display text-2xl text-navy mb-2">{settings.title}</h3>
          <p className="text-sm text-ink/70 leading-relaxed mb-5">{settings.description}</p>

          {success ? (
            <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <span className="mt-0.5 shrink-0">✓</span>
              <span>Request received! Our team will call you within 24 hours to schedule a visit.</span>
            </div>
          ) : (
            <button
              onClick={() => setOpen((o) => !o)}
              className="w-full bg-navy text-cream py-3 rounded-full font-medium hover:bg-navy/90 transition-colors text-sm"
            >
              {open ? "← Cancel" : settings.buttonText}
            </button>
          )}
        </div>
      </div>

      {/* Collapsible form */}
      {open && (
        <div className="border-t border-cream-200 bg-white px-6 py-6">
          <p className="text-sm font-medium text-navy mb-4">Tell us a bit about yourself</p>
          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Name + Phone */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="eyebrow block mb-1 text-[10px]">Full Name *</label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={update("customerName")}
                  required
                  placeholder="Priya Sharma"
                  className="w-full border border-cream-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1 text-[10px]">Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full border border-cream-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="eyebrow block mb-1 text-[10px]">Email (optional)</label>
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="priya@example.com"
                className="w-full border border-cream-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
              />
            </div>

            {/* Address */}
            <div>
              <label className="eyebrow block mb-1 text-[10px]">Address *</label>
              <textarea
                value={form.address}
                onChange={update("address")}
                required
                rows={2}
                placeholder="Flat 4B, Sunshine Apartments, MG Road"
                className="w-full border border-cream-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy resize-none"
              />
            </div>

            {/* City + State + Pincode */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="eyebrow block mb-1 text-[10px]">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={update("city")}
                  placeholder="Jaipur"
                  className="w-full border border-cream-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1 text-[10px]">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={update("state")}
                  placeholder="Rajasthan"
                  className="w-full border border-cream-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1 text-[10px]">Pincode</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={update("pincode")}
                  placeholder="302001"
                  maxLength={6}
                  className="w-full border border-cream-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            {/* Disclaimer */}
            {settings.disclaimer && (
              <p className="text-[11px] text-muted italic leading-relaxed">
                {settings.disclaimer}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-navy text-cream py-2.5 rounded-full text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null); }}
                className="px-6 border border-cream-200 rounded-full text-sm text-ink hover:border-navy transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
