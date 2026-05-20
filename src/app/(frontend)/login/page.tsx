"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const r = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(r.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-semibold mb-2 tracking-tight">Sign in to Dazzlez</h1>
        <p className="text-zinc-600 mb-8 text-sm">
          Enter your email and we&apos;ll send you a one-time sign-in link. No password needed.
        </p>

        {status === "sent" ? (
          <div className="rounded border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-4 text-sm">
            <p className="font-medium mb-1">Check your inbox</p>
            <p>
              If <span className="font-medium">{email}</span> is a valid address, you&apos;ll receive a
              sign-in link in a moment. (Dev mode: check the terminal where the server is running.)
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-zinc-800">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                disabled={status === "submitting"}
              />
            </label>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full rounded-full bg-zinc-900 text-white py-2.5 font-medium hover:bg-zinc-800 disabled:opacity-60"
            >
              {status === "submitting" ? "Sending…" : "Send me a link"}
            </button>
            {status === "error" && (
              <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
