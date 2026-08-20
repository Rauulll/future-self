"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("email", { email, redirect: false, callbackUrl: "/" });
      if (res?.error) throw new Error("Couldn't send the link. Try again.");
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <p className="font-ui text-xs uppercase tracking-[0.15em] text-ink-soft mb-3">
          Future Self
        </p>

        {sent ? (
          <>
            <h1 className="font-display text-2xl italic text-ink mb-3">Check your email</h1>
            <p className="font-body text-ink-soft">
              A link is on its way to {email}. Open it on this device to continue.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl italic text-ink mb-3">Sign in to write</h1>
            <p className="font-body text-ink-soft mb-6">
              No password — we&apos;ll email you a link.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="font-ui text-sm bg-white/60 border border-line rounded-lg px-3 py-2.5 text-ink text-center placeholder:text-ink-soft/60"
              />
              <button
                type="submit"
                disabled={loading}
                className="font-ui text-sm px-5 py-2.5 rounded-full bg-seal text-white shadow-seal hover:bg-seal-dark transition-colors disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send me a link"}
              </button>
            </form>
            {error && (
              <p className="font-ui text-sm text-seal-dark mt-4 bg-seal/10 border border-seal/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
