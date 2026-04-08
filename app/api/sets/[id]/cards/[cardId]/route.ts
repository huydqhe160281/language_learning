import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateLocalUserId } from "@/lib/local-user";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> },
) {
  try {
    const { id: setId, cardId } = await params;
    const userId = await getOrCreateLocalUserId();

    const set = await prisma.set.findUnique({ where: { id: setId } });
    if (!set || set.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const existing = await prisma.card.findUnique({ where: { id: cardId } });
    if (!existing || existing.setId !== setId) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const body = await request.json();
    const front = typeof body.front === "string" ? body.front.trim() : "";
    const back = typeof body.back === "string" ? body.back.trim() : "";
    if (!front || !back) {
      return NextResponse.json(
        { error: "front and back are required" },
        { status: 400 },
      );
    }

    let example: string | null;
    if (body.example === undefined) {
      example = existing.example;
    } else if (body.example === null) {
      example = null;
    } else if (typeof body.example === "string") {
      const t = body.example.trim();
      example = t.length > 0 ? t : null;
    } else {
      example = null;
    }

    const card = await prisma.card.update({
      where: { id: cardId },
      data: { front, back, example },
    });

    return NextResponse.json(card);
  } catch (error) {
    console.error("Error updating card:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> },
) {
  try {
    const { id: setId, cardId } = await params;
    const userId = await getOrCreateLocalUserId();

    const set = await prisma.set.findUnique({ where: { id: setId } });
    if (!set || set.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card || card.setId !== setId) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    await prisma.card.delete({ where: { id: cardId } });
    return NextResponse.json({ message: "Card deleted successfully" });
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
