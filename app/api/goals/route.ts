import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");

  try {
    const goals = await prisma.goal.findMany({
      where: year ? { year: parseInt(year) } : undefined,
      include: {
        monthlyPlans: true,
        category: { select: { id: true, name: true, icon: true, color: true } },
        _count: { select: { dailyLogs: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(goals);
  } catch (error) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, title, description, categoryId } = body;

    if (!year || !title) {
      return NextResponse.json({ error: "year and title are required" }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: { year: parseInt(year), title, description, categoryId: categoryId ?? null },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}


