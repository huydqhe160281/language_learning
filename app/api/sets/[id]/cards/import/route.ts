import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateLocalUserId } from "@/lib/local-user";

interface ImportCardItem {
  front: string;
  back: string;
  example?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: setId } = await params;
    const userId = await getOrCreateLocalUserId();

    const set = await prisma.set.findUnique({ where: { id: setId } });
    if (!set || set.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { cards } = body as { cards: ImportCardItem[] };

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: "cards must be a non-empty array" },
        { status: 400 },
      );
    }

    // Validate and sanitise each row
    const validCards = cards
      .map((c) => ({
        front: typeof c.front === "string" ? c.front.trim() : "",
        back: typeof c.back === "string" ? c.back.trim() : "",
        example:
          typeof c.example === "string" && c.example.trim()
            ? c.example.trim()
            : null,
        setId,
      }))
      .filter((c) => c.front && c.back);

    if (validCards.length === 0) {
      return NextResponse.json(
        { error: "No valid cards found — each row needs a front and a back" },
        { status: 400 },
      );
    }

    const result = await prisma.card.createMany({
      data: validCards,
      skipDuplicates: false,
    });

    return NextResponse.json({ imported: result.count }, { status: 201 });
  } catch (error) {
    console.error("Error importing cards:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
