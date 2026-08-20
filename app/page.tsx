"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import LetterCard, { LetterSummary } from "@/components/LetterCard";

const FILTERS = ["all", "scheduled", "draft", "sent"] as const;
type Filter = (typeof FILTERS)[number];

export default function DashboardPage() {
  const [letters, setLetters] = useState<LetterSummary[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/letters")
      .then((r) => r.json())
      .then(setLetters)
      .catch(() => setLetters([]));
  }, []);

  const visible = (letters ?? []).filter((l) => filter === "all" || l.status === filter);

  return (
    <main className="min-h-screen">
      <Header />

      <section className="max-w-3xl mx-auto px-6 pt-14 pb-10">
        <p className="font-ui text-xs uppercase tracking-[0.15em] text-ink-soft mb-3">
          A letter across time
        </p>
        <h1 className="font-display text-4xl md:text-5xl italic text-ink leading-tight mb-4">
          Say something to yourself,
          <br />
          on a date you don&apos;t live in yet.
        </h1>
        <p className="font-body text-ink-soft max-w-lg text-lg">
          Two ways to write across time. Both take about ten minutes and arrive
          by email exactly when you choose.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 grid sm:grid-cols-2 gap-4 mb-14">
        <Link
          href="/write/COMMIT"
          className="group relative overflow-hidden rounded-2xl border border-line bg-white/70 hover:bg-white p-6 shadow-card transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-dusk-near/20 flex items-center justify-center mb-5">
            <span className="w-2 h-2 rounded-full bg-dusk-near" />
          </div>
          <h2 className="font-display text-2xl text-ink mb-2">Future Self Commit</h2>
          <p className="font-body text-ink-soft text-[15px] leading-relaxed">
            Write to who you&apos;ll become. Say who you are now, what you&apos;re
            committing to, and where you promise to be.
          </p>
          <span className="mt-5 inline-block font-ui text-sm text-dusk-far group-hover:underline">
            Start writing →
          </span>
        </Link>

        <Link
          href="/write/CONNECT"
          className="group relative overflow-hidden rounded-2xl border border-line bg-white/70 hover:bg-white p-6 shadow-card transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-seal/20 flex items-center justify-center mb-5">
            <span className="w-2 h-2 rounded-full bg-seal" />
          </div>
          <h2 className="font-display text-2xl text-ink mb-2">Future Self Connect</h2>
          <p className="font-body text-ink-soft text-[15px] leading-relaxed">
            Write as who you&apos;ll become. Describe that life, and send advice
            back to who you are today.
          </p>
          <span className="mt-5 inline-block font-ui text-sm text-seal-dark group-hover:underline">
            Start writing →
          </span>
        </Link>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">Your letters</h2>
          <div className="flex gap-1 font-ui text-xs">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-full capitalize transition-colors ${
                  filter === f ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-dim"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {letters === null && (
          <p className="font-body text-ink-soft text-sm">Loading your letters…</p>
        )}

        {letters !== null && visible.length === 0 && (
          <div className="border border-dashed border-line rounded-xl px-6 py-10 text-center">
            <p className="font-body text-ink-soft">
              {letters.length === 0
                ? "Nothing written yet. Your first letter takes about ten minutes."
                : "No letters in this view."}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {visible.map((letter) => (
            <LetterCard key={letter.id} letter={letter} />
          ))}
        </div>
      </section>
    </main>
  );
}
