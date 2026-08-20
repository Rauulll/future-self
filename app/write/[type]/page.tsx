"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import TimelinePicker from "@/components/TimelinePicker";
import WritingTimer from "@/components/WritingTimer";
import WordCount from "@/components/WordCount";
import TimeDepthMark from "@/components/TimeDepthMark";
import { PROMPTS, LetterType, timelineDepth } from "@/lib/timeline";

export default function WritePage({ params }: { params: { type: string } }) {
  const router = useRouter();
  const type = (params.type || "").toUpperCase() as LetterType;
  const config = PROMPTS[type];

  const [startedAt] = useState(() => Date.now());
  const [title, setTitle] = useState("");
  const [timelineKey, setTimelineKey] = useState("12m");
  const [customDate, setCustomDate] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sections, setSections] = useState<string[]>(
    () => config?.sections.map(() => "") ?? []
  );
  const [saving, setSaving] = useState<"draft" | "schedule" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const combinedText = useMemo(() => sections.join(" "), [sections]);
  const depth = timelineDepth(timelineKey);

  if (!config) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <p className="font-body text-ink-soft">Unknown letter type.</p>
        </div>
      </main>
    );
  }

  async function handleSave(mode: "draft" | "schedule") {
    setError(null);

    if (mode === "schedule") {
      if (!recipientEmail.trim()) {
        setError("Add the email address this letter should arrive at.");
        return;
      }
      if (timelineKey === "custom" && !customDate) {
        setError("Choose the date this letter should arrive.");
        return;
      }
    }

    setSaving(mode);
    try {
      const res = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          timelineKey,
          customDate: timelineKey === "custom" ? customDate : undefined,
          title: title.trim() || `Untitled ${config.title}`,
          sections: config.sections.map((prompt, i) => ({ prompt, text: sections[i] })),
          recipientEmail: recipientEmail.trim() || "not-set@example.com",
          status: mode === "draft" ? "draft" : "scheduled",
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Something went wrong");
      }
      const letter = await res.json();
      router.push(`/letters/${letter.id}`);
    } catch (e: any) {
      setError(e.message);
      setSaving(null);
    }
  }

  return (
    <main className="min-h-screen">
      <Header />

      {/* Top bar: identity of the letter + live feedback, distraction-free */}
      <div className="border-b border-line bg-paper/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <TimeDepthMark depth={depth} />
            <span className="font-ui text-xs uppercase tracking-wide text-ink-soft truncate">
              {config.title}
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <WordCount text={combinedText} />
            <WritingTimer startedAt={startedAt} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`Untitled ${config.title}`}
          className="w-full font-display text-3xl italic text-ink bg-transparent placeholder:text-ink-soft/40 mb-2"
        />
        <p className="font-body text-ink-soft mb-8">{config.intro}</p>

        <div className="mb-10 space-y-3">
          <p className="font-ui text-xs uppercase tracking-wide text-ink-soft">
            When should it arrive?
          </p>
          <TimelinePicker
            value={timelineKey}
            customDate={customDate}
            onChange={setTimelineKey}
            onCustomDateChange={setCustomDate}
          />
          <div>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="you@example.com — where the letter will be sent"
              className="w-full font-ui text-sm bg-white/60 border border-line rounded-lg px-3 py-2 text-ink placeholder:text-ink-soft/60"
            />
          </div>
        </div>

        <div className="space-y-10">
          {config.sections.map((prompt, i) => (
            <div key={i}>
              <label className="block font-display italic text-lg text-dusk-far mb-2">
                {prompt}
              </label>
              <textarea
                value={sections[i]}
                onChange={(e) =>
                  setSections((prev) => prev.map((t, idx) => (idx === i ? e.target.value : t)))
                }
                rows={5}
                placeholder="Write freely — this isn't being graded, only kept."
                className="w-full font-body text-lg leading-relaxed bg-transparent border-0 border-b border-line focus:border-dusk-mid placeholder:text-ink-soft/40 resize-none py-2 transition-colors"
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="font-ui text-sm text-seal-dark mt-6 bg-seal/10 border border-seal/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-12 flex items-center gap-3">
          <button
            onClick={() => handleSave("schedule")}
            disabled={saving !== null}
            className="font-ui text-sm px-5 py-2.5 rounded-full bg-seal text-white shadow-seal hover:bg-seal-dark transition-colors disabled:opacity-50"
          >
            {saving === "schedule" ? "Sealing…" : "Seal & schedule this letter"}
          </button>
          <button
            onClick={() => handleSave("draft")}
            disabled={saving !== null}
            className="font-ui text-sm px-5 py-2.5 rounded-full border border-line text-ink-soft hover:text-ink hover:border-ink-soft transition-colors disabled:opacity-50"
          >
            {saving === "draft" ? "Saving…" : "Save as draft"}
          </button>
        </div>
      </div>
    </main>
  );
}
