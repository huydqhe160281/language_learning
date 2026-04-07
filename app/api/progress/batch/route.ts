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

interface BatchItem {
  cardId: string;
  setId: string;
  isCorrect: boolean;
}

type ExistingRow = {
  cardId: string;
  correct: number;
  incorrect: number;
  easeFactor: number;
  interval: number;
};

export async function POST(request: NextRequest) {
  try {
    const userId = await getOrCreateLocalUserId();

    const body = await request.json();
    const { updates } = body as { updates: BatchItem[] };

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "updates must be a non-empty array" },
        { status: 400 },
      );
    }

    // Fetch all existing progress records for these cards in one query
    const cardIds = updates.map((u) => u.cardId);
    const existing = await prisma.progress.findMany({
      where: { userId, cardId: { in: cardIds } },
      select: {
        cardId: true,
        correct: true,
        incorrect: true,
        easeFactor: true,
        interval: true,
      },
    });

    const existingMap = new Map<string, ExistingRow>(
      (existing as ExistingRow[]).map((p) => [p.cardId, p]),
    );

    // Run all upserts in a transaction
    await prisma.$transaction(
      updates.map(({ cardId, setId, isCorrect }) => {
        const prev = existingMap.get(cardId);
        const prevCorrect = prev?.correct ?? 0;
        const prevIncorrect = prev?.incorrect ?? 0;
        const prevEaseFactor = prev?.easeFactor ?? 2.5;
        const prevInterval = prev?.interval ?? 0;

        const { nextInterval, nextEaseFactor, nextReviewDate } =
          calculateNextReview(isCorrect, prevEaseFactor, prevInterval);

        return prisma.progress.upsert({
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
      }),
    );

    return NextResponse.json({ updated: updates.length }, { status: 200 });
  } catch (error) {
    console.error("Error batch updating progress:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
