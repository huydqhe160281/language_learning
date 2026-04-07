import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateLocalUserId } from "@/lib/local-user";

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
