import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMonthlyReview } from "@/lib/claude";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  const { year, month } = await params;
  try {
    const review = await prisma.monthlyReview.findUnique({
      where: { year_month: { year: parseInt(year), month: parseInt(month) } },
    });
    if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    return NextResponse.json({ ...review, stats: JSON.parse(review.stats) });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 });
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  try {
    // Get all daily logs for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const logs = await prisma.dailyLog.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: {
        goal: { select: { title: true } },
        monthlyPlan: { select: { title: true } },
      },
    });

    // Get active goals for this year
    const goals = await prisma.goal.findMany({
      where: { year, status: "ACTIVE" },
      select: { title: true, description: true },
    });

    // Calculate stats
    const totalLogs = logs.length;
    const totalMinutes = logs.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
    const monthlyLinked = logs.filter((l) => l.alignmentType === "MONTHLY_LINKED").length;
    const goalAligned = logs.filter((l) => l.alignmentType === "GOAL_ALIGNED").length;
    const unrelated = logs.filter((l) => l.alignmentType === "UNRELATED").length;

    const goalBreakdown: Record<string, number> = {};
    const planBreakdown: Record<string, number> = {};

    for (const log of logs) {
      if (log.goal) {
        goalBreakdown[log.goal.title] = (goalBreakdown[log.goal.title] ?? 0) + 1;
      }
      if (log.monthlyPlan) {
        planBreakdown[log.monthlyPlan.title] = (planBreakdown[log.monthlyPlan.title] ?? 0) + 1;
      }
    }

    const stats = {
      totalLogs,
      totalMinutes,
      monthlyLinked,
      goalAligned,
      unrelated,
      monthlyLinkedPct: totalLogs > 0 ? Math.round((monthlyLinked / totalLogs) * 100) : 0,
      goalAlignedPct: totalLogs > 0 ? Math.round((goalAligned / totalLogs) * 100) : 0,
      unrelatedPct: totalLogs > 0 ? Math.round((unrelated / totalLogs) * 100) : 0,
      goalBreakdown,
      planBreakdown,
    };

    // Generate review with Claude API
    const content = await generateMonthlyReview(year, month, stats, goals);

    // Upsert review (stats stored as JSON string for SQLite)
    const statsJson = JSON.stringify(stats);
    const review = await prisma.monthlyReview.upsert({
      where: { year_month: { year, month } },
      create: { year, month, content, stats: statsJson },
      update: { content, stats: statsJson },
    });

    // Parse stats back to object before returning
    return NextResponse.json({ ...review, stats }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to generate review" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  try {
    const body = await request.json();
    const { content } = body;

    const review = await prisma.monthlyReview.update({
      where: { year_month: { year, month } },
      data: { content },
    });
    return NextResponse.json(review);
  } catch (error) {
    console.error("PATCH /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}


