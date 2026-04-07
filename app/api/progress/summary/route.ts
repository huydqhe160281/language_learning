import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateLocalUserId } from "@/lib/local-user";

export interface SetProgressSummary {
  setId: string;
  title: string;
  language: string;
  totalCards: number;
  studiedCards: number;
  unstudiedCards: number;
  correct: number;
  incorrect: number;
  masteryPct: number;
  dueToday: number;
}

export interface ProgressSummaryResponse {
  totalCards: number;
  studiedCards: number;
  unstudiedCards: number;
  totalCorrect: number;
  totalIncorrect: number;
  overallMasteryPct: number;
  dueToday: number;
  sets: SetProgressSummary[];
}

export async function GET() {
  try {
    const userId = await getOrCreateLocalUserId();
    const now = new Date();

    // Fetch all sets with card count owned by this user
    const sets = await prisma.set.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        language: true,
        _count: { select: { cards: true } },
      },
    });

    if (sets.length === 0) {
      return NextResponse.json({
        totalCards: 0,
        studiedCards: 0,
        unstudiedCards: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        overallMasteryPct: 0,
        dueToday: 0,
        sets: [],
      } satisfies ProgressSummaryResponse);
    }

    // Fetch all progress records for this user in one query
    const progressRows = await prisma.progress.findMany({
      where: { userId },
      select: {
        setId: true,
        correct: true,
        incorrect: true,
        nextReviewAt: true,
      },
    });

    // Build per-set index
    type RowAccumulator = {
      correct: number;
      incorrect: number;
      studiedCards: number;
      dueToday: number;
    };
    const bySet = new Map<string, RowAccumulator>();

    for (const row of progressRows) {
      const bucket = bySet.get(row.setId) ?? {
        correct: 0,
        incorrect: 0,
        studiedCards: 0,
        dueToday: 0,
      };
      bucket.correct += row.correct;
      bucket.incorrect += row.incorrect;
      bucket.studiedCards += 1;
      if (row.nextReviewAt && new Date(row.nextReviewAt) <= now) {
        bucket.dueToday += 1;
      }
      bySet.set(row.setId, bucket);
    }

    // Build per-set summaries
    const setRows: SetProgressSummary[] = sets.map((s) => {
      const bucket = bySet.get(s.id);
      const totalCards = s._count.cards;
      const studiedCards = bucket?.studiedCards ?? 0;
      const correct = bucket?.correct ?? 0;
      const incorrect = bucket?.incorrect ?? 0;
      const reviews = correct + incorrect;
      const masteryPct =
        reviews === 0 ? 0 : Math.round((correct / reviews) * 100);

      return {
        setId: s.id,
        title: s.title,
        language: s.language,
        totalCards,
        studiedCards,
        unstudiedCards: Math.max(0, totalCards - studiedCards),
        correct,
        incorrect,
        masteryPct,
        dueToday: bucket?.dueToday ?? 0,
      };
    });

    // Global totals
    const totalCards = setRows.reduce((a, s) => a + s.totalCards, 0);
    const studiedCards = setRows.reduce((a, s) => a + s.studiedCards, 0);
    const totalCorrect = setRows.reduce((a, s) => a + s.correct, 0);
    const totalIncorrect = setRows.reduce((a, s) => a + s.incorrect, 0);
    const dueToday = setRows.reduce((a, s) => a + s.dueToday, 0);
    const allReviews = totalCorrect + totalIncorrect;
    const overallMasteryPct =
      allReviews === 0 ? 0 : Math.round((totalCorrect / allReviews) * 100);

    return NextResponse.json(
      {
        totalCards,
        studiedCards,
        unstudiedCards: Math.max(0, totalCards - studiedCards),
        totalCorrect,
        totalIncorrect,
        overallMasteryPct,
        dueToday,
        sets: setRows,
      } satisfies ProgressSummaryResponse,
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching progress summary:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
