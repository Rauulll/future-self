import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { targetDateFromKey } from "@/lib/timeline";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const letters = await prisma.letter.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(letters);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, timelineKey, customDate, title, sections, recipientEmail, status } = body;

  if (!type || !timelineKey || !title || !sections || !recipientEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let targetDate: Date;
  try {
    targetDate = targetDateFromKey(timelineKey, customDate);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const resolvedStatus = status === "draft" ? "draft" : "scheduled";

  const letter = await prisma.letter.create({
    data: {
      userId: session.user.id,
      type,
      timelineKey,
      targetDate,
      title,
      sections: JSON.stringify(sections),
      recipientEmail,
      status: resolvedStatus,
      // Anchors the 24-hour edit-lock grace period — see lib/timeline.ts.
      scheduledAt: resolvedStatus === "scheduled" ? new Date() : null,
    },
  });

  return NextResponse.json(letter, { status: 201 });
}
