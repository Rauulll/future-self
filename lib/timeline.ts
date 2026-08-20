export type LetterType = "COMMIT" | "CONNECT";

export interface TimelineOption {
  key: string;
  label: string;
  months?: number; // undefined => custom
}

export const TIMELINE_OPTIONS: TimelineOption[] = [
  { key: "12m", label: "12 months", months: 12 },
  { key: "3y", label: "3 years", months: 36 },
  { key: "5y", label: "5 years", months: 60 },
  { key: "10y", label: "10 years", months: 120 },
  { key: "20y", label: "20 years", months: 240 },
  { key: "50y", label: "50 years", months: 600 },
  { key: "custom", label: "Custom date" },
];

export function targetDateFromKey(key: string, customDate?: string): Date {
  if (key === "custom") {
    if (!customDate) throw new Error("Custom timeline requires a date");
    const d = new Date(customDate);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid custom date");
    return d;
  }
  const opt = TIMELINE_OPTIONS.find((o) => o.key === key);
  if (!opt || !opt.months) throw new Error("Unknown timeline");
  const d = new Date();
  d.setMonth(d.getMonth() + opt.months);
  return d;
}

export function timelineLabel(key: string): string {
  return TIMELINE_OPTIONS.find((o) => o.key === key)?.label ?? "Custom date";
}

// How "deep" a timeline is, 0 (near) to 1 (deepest), used only for the
// signature time-depth gradient — purely visual, encodes real distance.
export function timelineDepth(key: string, targetDate?: Date): number {
  if (key !== "custom") {
    const opt = TIMELINE_OPTIONS.find((o) => o.key === key);
    const maxMonths = 600;
    return Math.min(1, (opt?.months ?? 12) / maxMonths);
  }
  if (!targetDate) return 0.2;
  const months =
    (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
  return Math.min(1, Math.max(0, months / 600));
}

export const PROMPTS: Record<
  LetterType,
  { title: string; intro: string; sections: string[] }
> = {
  COMMIT: {
    title: "Future Self Commit",
    intro:
      "Write to the person you'll be. Say who you are right now, what you're committing to, and where you promise to be.",
    sections: [
      "Who are you, right now, as you write this?",
      "What are you committing to between today and then?",
      "Where do you promise to be — and who do you promise to be — by that date?",
    ],
  },
  CONNECT: {
    title: "Future Self Connect",
    intro:
      "Write as if you are already the person you'll become. Describe that life, and speak back to who you are today.",
    sections: [
      "Who did you become? Describe yourself, as your future self.",
      "What does life look like now? Be specific and honest.",
      "What are you focused on these days?",
      "What's your advice to the self who wrote this — back on today's date?",
      "Anything else you have in mind? I'm sure you have one👀",
    ],
  },
};

export const WORD_TARGET = 500; // roughly two pages
export const TIME_TARGET_MINUTES = 10;

// How long after scheduling a letter stays editable. Anchored to the
// moment it was first scheduled, not to each edit, so re-saving doesn't
// keep pushing the lock back — that would defeat the point of a commitment.
export const EDIT_GRACE_PERIOD_HOURS = 24;

export function isSealed(status: string, scheduledAt: string | Date | null): boolean {
  if (status !== "scheduled" || !scheduledAt) return false;
  const scheduled = typeof scheduledAt === "string" ? new Date(scheduledAt) : scheduledAt;
  const elapsedHours = (Date.now() - scheduled.getTime()) / (1000 * 60 * 60);
  return elapsedHours >= EDIT_GRACE_PERIOD_HOURS;
}

export function sealTime(scheduledAt: string | Date): Date {
  const scheduled = typeof scheduledAt === "string" ? new Date(scheduledAt) : scheduledAt;
  return new Date(scheduled.getTime() + EDIT_GRACE_PERIOD_HOURS * 60 * 60 * 1000);
}
