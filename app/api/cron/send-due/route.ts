import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLetterEmail } from "@/lib/email";

// This endpoint is meant to be called on a schedule (e.g. daily) by an
// external cron trigger. It finds every "scheduled" letter whose target
// date has arrived and hasn't been sent, emails it, and marks it sent.
export async function GET(req: NextRequest) {
  // Accepts either ?secret=... (for external pingers like cron-job.org)
  // or an "Authorization: Bearer ..." header (which Vercel Cron sends
  // automatically when CRON_SECRET is set as an env var).
  const querySecret = req.nextUrl.searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const provided = querySecret || bearerSecret;

  if (!process.env.CRON_SECRET || provided !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await prisma.letter.findMany({
    where: { status: "scheduled", targetDate: { lte: new Date() } },
  });

  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const letter of due) {
    try {
      await sendLetterEmail(letter.recipientEmail, letter);
      await prisma.letter.update({
        where: { id: letter.id },
        data: { status: "sent", sentAt: new Date() },
      });
      results.push({ id: letter.id, ok: true });
    } catch (e: any) {
      results.push({ id: letter.id, ok: false, error: e.message });
    }
  }

  return NextResponse.json({ checked: due.length, results });
}
