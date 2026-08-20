"use client";

import Link from "next/link";
import TimeDepthMark from "./TimeDepthMark";
import { timelineDepth, timelineLabel } from "@/lib/timeline";

export interface LetterSummary {
  id: string;
  type: string;
  timelineKey: string;
  targetDate: string;
  title: string;
  status: string;
}

export default function LetterCard({ letter }: { letter: LetterSummary }) {
  const depth = timelineDepth(letter.timelineKey, new Date(letter.targetDate));
  const target = new Date(letter.targetDate);
  const statusLabel =
    letter.status === "sent"
      ? `Delivered ${target.toLocaleDateString()}`
      : letter.status === "draft"
      ? "Draft — not scheduled"
      : `Arrives ${target.toLocaleDateString()}`;

  return (
    <Link
      href={`/letters/${letter.id}`}
      className="group block bg-white/70 hover:bg-white border border-line rounded-xl px-5 py-4 shadow-card transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TimeDepthMark depth={depth} size={8} />
            <span className="font-ui text-xs uppercase tracking-wide text-ink-soft">
              {letter.type === "COMMIT" ? "Commit" : "Connect"} · {timelineLabel(letter.timelineKey)}
            </span>
          </div>
          <h3 className="font-display text-lg text-ink truncate">{letter.title}</h3>
        </div>
        <span
          className={`shrink-0 font-ui text-xs px-2.5 py-1 rounded-full ${
            letter.status === "sent"
              ? "bg-paper-dim text-ink-soft"
              : letter.status === "draft"
              ? "bg-paper-dim text-ink-soft"
              : "bg-dusk-near/15 text-dusk-far"
          }`}
        >
          {statusLabel}
        </span>
      </div>
    </Link>
  );
}
