import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateLocalUserId } from "@/lib/local-user";

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
    const front = typeof body.front === "string" ? body.front.trim() : "";
    const back = typeof body.back === "string" ? body.back.trim() : "";
    const example =
      typeof body.example === "string" ? body.example.trim() || null : null;

    if (!front || !back) {
      return NextResponse.json(
        { error: "front and back are required" },
        { status: 400 },
      );
    }

    const card = await prisma.card.create({
      data: { front, back, example, setId },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("Error creating card:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
