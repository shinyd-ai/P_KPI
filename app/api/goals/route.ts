import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const targetYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();

  try {
    const goals = await prisma.goal.findMany({
      where: yearParam ? { year: parseInt(yearParam) } : undefined,
      include: {
        monthlyPlans: {
          where: { year: targetYear },
          select: { id: true, status: true },
        },
        category: { select: { id: true, name: true, icon: true, color: true } },
        _count: { select: { dailyLogs: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 각 goal에 progressRate 계산하여 추가
    const goalsWithProgress = goals.map((goal) => {
      const plans = goal.monthlyPlans;
      const total = plans.length;
      const completedCount = plans.filter((p) => p.status === "COMPLETED").length;
      const progressRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
      return { ...goal, progressRate };
    });

    return NextResponse.json(goalsWithProgress);
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


