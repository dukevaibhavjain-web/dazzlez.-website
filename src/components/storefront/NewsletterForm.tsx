"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    // TODO: wire up to email provider (Brevo / Mailchimp)
    await new Promise((r) => setTimeout(r, 600));
    setStatus("success");
    setEmail("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-sm">
      {status === "success" ? (
        <p className="text-gold text-sm py-2">
          ✓ You&apos;re on the list! We&apos;ll be in touch.
        </p>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Your email address"
            className="flex-1 bg-white/10 border border-cream/20 text-cream placeholder:text-cream/40 text-sm rounded-full px-4 py-2.5 focus:outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-gold text-navy text-sm font-medium px-5 py-2.5 rounded-full hover:bg-gold/90 transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {status === "loading" ? "…" : "Subscribe"}
          </button>
        </>
      )}
    </form>
  );
}
