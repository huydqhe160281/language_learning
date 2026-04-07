import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateLocalUserId } from "@/lib/local-user";

export async function GET(request: NextRequest) {
  try {
    const userId = await getOrCreateLocalUserId();

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const language = (searchParams.get("language") ?? "").trim();

    const sets = await prisma.set.findMany({
      where: {
        userId,
        ...(language ? { language } : {}),
        ...(q
          ? {
              title: {
                contains: q,
                mode: "insensitive",
              },
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        language: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        _count: { select: { cards: true } },
      },
    });

    return NextResponse.json(sets, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching sets:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getOrCreateLocalUserId();

    const body = await request.json();
    const { title, description, language, isPublic, cards } = body;

    if (!title || !language) {
      return NextResponse.json(
        { error: "Title and language are required" },
        { status: 400 },
      );
    }

    const newSet = await prisma.set.create({
      data: {
        title,
        description: description || "",
        language,
        isPublic: isPublic || false,
        userId,
        cards: {
          create: cards || [],
        },
      },
      include: { cards: true },
    });

    return NextResponse.json(newSet, { status: 201 });
  } catch (error) {
    console.error("Error creating set:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
