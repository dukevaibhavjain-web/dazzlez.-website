"use client";

import { useState } from "react";

/**
 * Newsletter section shown on the homepage (above the footer).
 * More prominent than the footer strip — full-width navy panel
 * with a headline, supporting copy, and an email form.
 */
export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    // TODO: wire up to Brevo / Mailchimp
    await new Promise((r) => setTimeout(r, 600));
    setStatus("success");
    setEmail("");
  };

  return (
    <section className="bg-navy py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
        <p className="eyebrow text-cream/50 mb-2">Dazzlez Club</p>
        <h2 className="font-display text-4xl sm:text-5xl text-cream mb-4">
          First Access. Always.
        </h2>
        <p className="text-cream/60 leading-relaxed mb-8 text-base">
          Be the first to know about new arrivals, exclusive offers, and lab-grown diamond
          education — delivered straight to your inbox.
        </p>

        {status === "success" ? (
          <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 text-gold px-6 py-3 rounded-full text-sm">
            <span>✓</span>
            <span>You&apos;re on the list! We&apos;ll be in touch.</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Your email address"
              className="flex-1 bg-white/10 border border-cream/20 text-cream placeholder:text-cream/40 text-sm rounded-full px-5 py-3 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-gold text-navy font-medium px-7 py-3 rounded-full hover:bg-gold/90 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {status === "loading" ? "…" : "Subscribe"}
            </button>
          </form>
        )}

        <p className="text-cream/30 text-xs mt-4">
          No spam. Unsubscribe any time.
        </p>
      </div>
    </section>
  );
}
