import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateLocalUserId } from "@/lib/local-user";

function calculateNextReview(
  isCorrect: boolean,
  currentEaseFactor: number,
  currentInterval: number,
): { nextInterval: number; nextEaseFactor: number; nextReviewDate: Date } {
  let newEaseFactor = currentEaseFactor;
  let newInterval = currentInterval;

  if (isCorrect) {
    if (currentInterval === 0) {
      newInterval = 1;
    } else if (currentInterval === 1) {
      newInterval = 3;
    } else {
      newInterval = Math.round(currentInterval * currentEaseFactor);
    }
  } else {
    newInterval = 1;
    newEaseFactor = Math.max(1.3, currentEaseFactor - 0.2);
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    nextInterval: newInterval,
    nextEaseFactor: newEaseFactor,
    nextReviewDate,
  };
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getOrCreateLocalUserId();

    const body = await request.json();
    const { cardId, setId, isCorrect } = body;

    if (!cardId || !setId) {
      return NextResponse.json(
        { error: "cardId and setId are required" },
        { status: 400 },
      );
    }

    if (typeof isCorrect !== "boolean") {
      return NextResponse.json(
        { error: "isCorrect must be a boolean" },
        { status: 400 },
      );
    }

    // Fetch existing record to compute incremental counters
    const existing = await prisma.progress.findUnique({
      where: { userId_cardId: { userId, cardId } },
      select: {
        correct: true,
        incorrect: true,
        easeFactor: true,
        interval: true,
      },
    });

    const prevCorrect = existing?.correct ?? 0;
    const prevIncorrect = existing?.incorrect ?? 0;
    const prevEaseFactor = existing?.easeFactor ?? 2.5;
    const prevInterval = existing?.interval ?? 0;

    const { nextInterval, nextEaseFactor, nextReviewDate } =
      calculateNextReview(isCorrect, prevEaseFactor, prevInterval);

    const updatedProgress = await prisma.progress.upsert({
      where: { userId_cardId: { userId, cardId } },
      create: {
        userId,
        cardId,
        setId,
        correct: isCorrect ? 1 : 0,
        incorrect: isCorrect ? 0 : 1,
        lastReviewedAt: new Date(),
        nextReviewAt: nextReviewDate,
        interval: nextInterval,
        easeFactor: nextEaseFactor,
      },
      update: {
        correct: isCorrect ? prevCorrect + 1 : prevCorrect,
        incorrect: isCorrect ? prevIncorrect : prevIncorrect + 1,
        lastReviewedAt: new Date(),
        nextReviewAt: nextReviewDate,
        interval: nextInterval,
        easeFactor: nextEaseFactor,
      },
    });

    return NextResponse.json(updatedProgress, { status: 200 });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getOrCreateLocalUserId();

    const { searchParams } = new URL(request.url);
    const setId = searchParams.get("setId");

    const whereClause: { userId: string; setId?: string } = { userId };
    if (setId) {
      whereClause.setId = setId;
    }

    const progress = await prisma.progress.findMany({
      where: whereClause,
      select: {
        id: true,
        correct: true,
        incorrect: true,
        lastReviewedAt: true,
        nextReviewAt: true,
        interval: true,
        easeFactor: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        setId: true,
        cardId: true,
      },
    });

    return NextResponse.json(progress, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
