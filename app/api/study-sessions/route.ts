import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateLocalUserId } from "@/lib/local-user";

export async function POST(request: NextRequest) {
  try {
    const userId = await getOrCreateLocalUserId();

    const body = await request.json();
    const { setId, mode, correctCount, totalCount, duration } = body;

    if (!setId || !mode || duration === undefined) {
      return NextResponse.json(
        { error: "setId, mode, and duration are required" },
        { status: 400 },
      );
    }

    const set = await prisma.set.findUnique({
      where: { id: setId },
    });

    if (!set || (!set.isPublic && set.userId !== userId)) {
      return NextResponse.json(
        { error: "Unauthorized access to set" },
        { status: 403 },
      );
    }

    const session = await prisma.studySession.create({
      data: {
        userId,
        setId,
        mode,
        correctCount: correctCount || 0,
        totalCount: totalCount || 0,
        duration,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Error creating study session:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getOrCreateLocalUserId();

    const { searchParams } = new URL(request.url);
    const setId = searchParams.get("setId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const whereClause: { userId: string; setId?: string } = { userId };
    if (setId) {
      whereClause.setId = setId;
    }

    const sessions = await prisma.studySession.findMany({
      where: whereClause,
      include: { set: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching study sessions:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
