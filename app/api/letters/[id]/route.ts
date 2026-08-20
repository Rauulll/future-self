import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { targetDateFromKey, isSealed } from "@/lib/timeline";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let letter = await prisma.letter.findUnique({ where: { id: params.id } });
  if (!letter || letter.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Self-heal: letters scheduled before the edit-lock feature existed have
  // no scheduledAt yet. Backfill from createdAt the first time they're
  // read, so the grace period has something to anchor to.
  if (letter.status === "scheduled" && !letter.scheduledAt) {
    letter = await prisma.letter.update({
      where: { id: letter.id },
      data: { scheduledAt: letter.createdAt },
    });
  }

  return NextResponse.json(letter);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.letter.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status === "sent") {
    return NextResponse.json({ error: "This letter has already been sent and can't be edited" }, { status: 400 });
  }
  if (isSealed(existing.status, existing.scheduledAt)) {
    return NextResponse.json(
      { error: "This letter sealed 24 hours after scheduling and can no longer be edited." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { timelineKey, customDate, title, sections, recipientEmail, status } = body;

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (sections !== undefined) data.sections = JSON.stringify(sections);
  if (recipientEmail !== undefined) data.recipientEmail = recipientEmail;
  if (status !== undefined) data.status = status;
  if (timelineKey !== undefined) {
    try {
      data.timelineKey = timelineKey;
      data.targetDate = targetDateFromKey(timelineKey, customDate);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  }

  // Only stamp scheduledAt the first time a letter becomes "scheduled" —
  // later edits within the grace period shouldn't push the lock back.
  const nextStatus = data.status ?? existing.status;
  if (nextStatus === "scheduled" && !existing.scheduledAt) {
    data.scheduledAt = new Date();
  }

  const letter = await prisma.letter.update({ where: { id: params.id }, data });
  return NextResponse.json(letter);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.letter.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.letter.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
