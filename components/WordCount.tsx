"use client";

import { WORD_TARGET } from "@/lib/timeline";

export default function WordCount({ text }: { text: string }) {
  const words = text.trim().length ? text.trim().split(/\s+/).length : 0;
  const pages = Math.max(0.1, words / 250);
  const pct = Math.min(100, Math.round((words / WORD_TARGET) * 100));

  return (
    <div className="font-ui text-sm text-ink-soft flex items-center gap-2">
      <div className="w-16 h-1 rounded-full bg-paper-dim overflow-hidden">
        <div
          className="h-full bg-dusk-mid transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span>
        {words} words · ~{pages.toFixed(1)} pages
      </span>
    </div>
  );
}
