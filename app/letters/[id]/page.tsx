"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import TimelinePicker from "@/components/TimelinePicker";
import TimeDepthMark from "@/components/TimeDepthMark";
import { PROMPTS, LetterType, timelineDepth, timelineLabel, isSealed, sealTime } from "@/lib/timeline";

interface Section {
  prompt: string;
  text: string;
}

interface Letter {
  id: string;
  type: string;
  timelineKey: string;
  targetDate: string;
  title: string;
  sections: string;
  recipientEmail: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
  scheduledAt: string | null;
}

export default function LetterDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [timelineKey, setTimelineKey] = useState("12m");
  const [customDate, setCustomDate] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/letters/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Letter not found");
        return r.json();
      })
      .then((data: Letter) => {
        setLetter(data);
        setTitle(data.title);
        setSections(JSON.parse(data.sections));
        setTimelineKey(data.timelineKey);
        setRecipientEmail(data.recipientEmail);
      })
      .catch(() => setLetter(null));
  }, [params.id]);

  if (letter === null) {
    return (
      <main className="min-h-screen">
        <Header />
        <p className="font-body text-ink-soft text-center mt-16">Loading…</p>
      </main>
    );
  }

  const depth = timelineDepth(letter.timelineKey, new Date(letter.targetDate));

  async function save(nextStatus?: string) {
    setError(null);
    if ((nextStatus ?? letter!.status) === "scheduled" && !recipientEmail.trim()) {
      setError("Add the email address this letter should arrive at.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/letters/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          sections,
          timelineKey,
          customDate: timelineKey === "custom" ? customDate : undefined,
          recipientEmail,
          status: nextStatus,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Couldn't save");
      }
      const updated = await res.json();
      setLetter(updated);
      setEditing(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this letter for good? This can't be undone.")) return;
    await fetch(`/api/letters/${params.id}`, { method: "DELETE" });
    router.push("/");
  }

  function handleExport() {
    const writtenOn = new Date(letter!.createdAt).toLocaleDateString();
    const body = sections.map((s) => `${s.prompt}\n\n${s.text}`).join("\n\n---\n\n");
    const text = `${title}\nWritten on ${writtenOn}\nArrives ${new Date(
      letter!.targetDate
    ).toLocaleDateString()}\n\n${body}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "letter"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const config = PROMPTS[letter.type as LetterType];
  const sent = letter.status === "sent";
  const sealed = isSealed(letter.status, letter.scheduledAt);
  const locked = sent || sealed;

  return (
    <main className="min-h-screen">
      <Header />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 mb-3">
          <TimeDepthMark depth={depth} />
          <span className="font-ui text-xs uppercase tracking-wide text-ink-soft">
            {config?.title} · {timelineLabel(letter.timelineKey)}
          </span>
        </div>

        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-display text-3xl italic text-ink bg-transparent mb-6"
          />
        ) : (
          <h1 className="font-display text-3xl italic text-ink mb-2">{letter.title}</h1>
        )}

        <div className="mb-8">
          <p className="font-ui text-sm text-ink-soft">
            Written {new Date(letter.createdAt).toLocaleDateString()} ·{" "}
            {sent
              ? `Delivered ${new Date(letter.sentAt!).toLocaleDateString()}`
              : letter.status === "draft"
              ? "Draft, not yet scheduled"
              : `Arrives ${new Date(letter.targetDate).toLocaleDateString()} at ${letter.recipientEmail}`}
          </p>
          {!sent && letter.status === "scheduled" && letter.scheduledAt && (
            <p className="font-ui text-xs text-ink-soft mt-1">
              {sealed
                ? "Sealed — this letter can no longer be edited."
                : `Editable until ${sealTime(letter.scheduledAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`}
            </p>
          )}
        </div>

        {editing && !locked && (
          <div className="mb-8 space-y-3">
            <p className="font-ui text-xs uppercase tracking-wide text-ink-soft">
              When should it arrive?
            </p>
            <TimelinePicker
              value={timelineKey}
              customDate={customDate}
              onChange={setTimelineKey}
              onCustomDateChange={setCustomDate}
            />
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full font-ui text-sm bg-white/60 border border-line rounded-lg px-3 py-2 text-ink"
            />
          </div>
        )}

        <div className="space-y-8">
          {sections.map((s, i) => (
            <div key={i}>
              <p className="font-display italic text-lg text-dusk-far mb-2">{s.prompt}</p>
              {editing && !locked ? (
                <textarea
                  value={s.text}
                  onChange={(e) =>
                    setSections((prev) =>
                      prev.map((sec, idx) => (idx === i ? { ...sec, text: e.target.value } : sec))
                    )
                  }
                  rows={5}
                  className="w-full font-body text-lg leading-relaxed bg-transparent border-0 border-b border-line focus:border-dusk-mid resize-none py-2"
                />
              ) : (
                <p className="font-body text-lg leading-relaxed text-ink whitespace-pre-wrap">
                  {s.text || <span className="text-ink-soft italic">(left blank)</span>}
                </p>
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="font-ui text-sm text-seal-dark mt-6 bg-seal/10 border border-seal/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-3">
          {sent ? (
            <span className="font-ui text-sm text-ink-soft">
              This letter has been delivered and is now read-only.
            </span>
          ) : sealed ? (
            <>
              <span className="font-ui text-sm text-ink-soft">
                This letter sealed 24 hours after scheduling and can no longer be edited.
              </span>
              <button
                onClick={handleExport}
                className="font-ui text-sm px-5 py-2.5 rounded-full border border-line text-ink hover:border-ink-soft transition-colors"
              >
                Export as text
              </button>
              <button
                onClick={handleDelete}
                className="font-ui text-sm px-5 py-2.5 rounded-full text-seal-dark hover:bg-seal/10 transition-colors"
              >
                Delete
              </button>
            </>
          ) : editing ? (
            <>
              <button
                onClick={() => save("scheduled")}
                disabled={saving}
                className="font-ui text-sm px-5 py-2.5 rounded-full bg-seal text-white shadow-seal hover:bg-seal-dark transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Seal & schedule"}
              </button>
              <button
                onClick={() => save(letter.status === "draft" ? "draft" : undefined)}
                disabled={saving}
                className="font-ui text-sm px-5 py-2.5 rounded-full border border-line text-ink-soft hover:text-ink transition-colors disabled:opacity-50"
              >
                Save changes
              </button>
              <button
                onClick={() => setEditing(false)}
                className="font-ui text-sm px-3 py-2.5 text-ink-soft hover:text-ink"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="font-ui text-sm px-5 py-2.5 rounded-full border border-line text-ink hover:border-ink-soft transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleExport}
                className="font-ui text-sm px-5 py-2.5 rounded-full border border-line text-ink hover:border-ink-soft transition-colors"
              >
                Export as text
              </button>
              <button
                onClick={handleDelete}
                className="font-ui text-sm px-5 py-2.5 rounded-full text-seal-dark hover:bg-seal/10 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
