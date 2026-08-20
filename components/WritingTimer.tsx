"use client";

import { useEffect, useState } from "react";
import { TIME_TARGET_MINUTES } from "@/lib/timeline";

export default function WritingTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(startedAt);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedSec = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;
  const overTarget = mins >= TIME_TARGET_MINUTES;

  return (
    <div className="flex items-center gap-2 font-ui text-sm">
      <span
        aria-hidden
        className={`w-1.5 h-1.5 rounded-full ${overTarget ? "bg-seal animate-breathe" : "bg-dusk-near animate-breathe"}`}
      />
      <span className={overTarget ? "text-seal-dark" : "text-ink-soft"}>
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        {overTarget && <span className="ml-1.5 italic font-body">— let it be enough</span>}
      </span>
    </div>
  );
}
