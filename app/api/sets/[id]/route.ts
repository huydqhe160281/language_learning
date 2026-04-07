import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateLocalUserId } from "@/lib/local-user";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const userId = await getOrCreateLocalUserId();

    const set = await prisma.set.findUnique({
      where: { id },
      include: { cards: true },
    });

    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 });
    }

    if (!set.isPublic && set.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(set, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching set:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const userId = await getOrCreateLocalUserId();

    const set = await prisma.set.findUnique({
      where: { id },
    });

    if (!set || set.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, language, isPublic } = body;

    const updatedSet = await prisma.set.update({
      where: { id },
      data: {
        title: title || set.title,
        description: description !== undefined ? description : set.description,
        language: language || set.language,
        isPublic: isPublic !== undefined ? isPublic : set.isPublic,
      },
      include: { cards: true },
    });

    return NextResponse.json(updatedSet);
  } catch (error) {
    console.error("Error updating set:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const userId = await getOrCreateLocalUserId();

    const set = await prisma.set.findUnique({
      where: { id },
    });

    if (!set || set.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.set.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Set deleted successfully" });
  } catch (error) {
    console.error("Error deleting set:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
