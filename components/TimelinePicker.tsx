"use client";

import { TIMELINE_OPTIONS } from "@/lib/timeline";
import { depthColor } from "@/lib/color";
import { timelineDepth } from "@/lib/timeline";

export default function TimelinePicker({
  value,
  customDate,
  onChange,
  onCustomDateChange,
}: {
  value: string;
  customDate: string;
  onChange: (key: string) => void;
  onCustomDateChange: (date: string) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TIMELINE_OPTIONS.map((opt) => {
          const active = value === opt.key;
          const depth = timelineDepth(opt.key);
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`font-ui text-sm px-3.5 py-2 rounded-full border transition-all flex items-center gap-2 ${
                active
                  ? "border-transparent text-white shadow-seal"
                  : "border-line bg-white/60 text-ink-soft hover:border-ink-soft"
              }`}
              style={active ? { backgroundColor: depthColor(depth) } : undefined}
            >
              {opt.key !== "custom" && (
                <span
                  aria-hidden
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: active ? "rgba(255,255,255,0.85)" : depthColor(depth) }}
                />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
      {value === "custom" && (
        <input
          type="date"
          value={customDate}
          onChange={(e) => onCustomDateChange(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="mt-3 font-ui text-sm bg-white/60 border border-line rounded-lg px-3 py-2 text-ink"
        />
      )}
    </div>
  );
}
