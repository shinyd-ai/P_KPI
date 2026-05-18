import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearStr = searchParams.get("year");
  const monthStr = searchParams.get("month");

  if (!yearStr || !monthStr) {
    return NextResponse.json({ error: "year and month are required" }, { status: 400 });
  }

  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  try {
    // DailyPlan: JS 필터 (LibSQL DateTime 범위 쿼리 이슈 회피)
    const allDailyPlans = await prisma.dailyPlan.findMany({
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            category: { select: { id: true, name: true, icon: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const dailyPlans = allDailyPlans.filter((p) => {
      return new Date(p.date).toISOString().slice(0, 7) === monthPrefix;
    });

    // MonthlyPlan: where 절로 조회
    const monthlyPlans = await prisma.monthlyPlan.findMany({
      where: { year, month },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            category: { select: { id: true, name: true, color: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // DailyLog: 날짜 범위 조회
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const dailyLogs = await prisma.dailyLog.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    });

    // ── DailyPlan 집계 ──────────────────────────────────────────
    const totalDailyPlans = dailyPlans.length;
    const completedDailyPlans = dailyPlans.filter((p) => p.completed).length;
    const completionRate =
      totalDailyPlans > 0 ? Math.round((completedDailyPlans / totalDailyPlans) * 100) : 0;

    let totalEstimatedMinutes = 0;
    let totalActualMinutes = 0;

    // 목표별 그룹핑
    const byGoalMap = new Map<
      string,
      {
        goalId: string | null;
        goalTitle: string;
        categoryIcon: string;
        estimatedMinutes: number;
        actualMinutes: number;
        completed: number;
        total: number;
      }
    >();

    for (const plan of dailyPlans) {
      const goalId = plan.goalId ?? null;
      const key = goalId ?? "__none__";

      if (!byGoalMap.has(key)) {
        byGoalMap.set(key, {
          goalId,
          goalTitle: plan.goal?.title ?? "미분류",
          categoryIcon: plan.goal?.category?.icon ?? "📌",
          estimatedMinutes: 0,
          actualMinutes: 0,
          completed: 0,
          total: 0,
        });
      }

      const g = byGoalMap.get(key)!;
      g.estimatedMinutes += plan.estimatedMinutes ?? 0;
      g.actualMinutes += plan.actualMinutes ?? 0;
      g.total += 1;
      if (plan.completed) g.completed += 1;

      totalEstimatedMinutes += plan.estimatedMinutes ?? 0;
      totalActualMinutes += plan.actualMinutes ?? 0;
    }

    const byGoal = Array.from(byGoalMap.values());

    // ── DailyLog 집계 ──────────────────────────────────────────
    const totalLogs = dailyLogs.length;
    const totalLogMinutes = dailyLogs.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
    const monthlyLinkedCount = dailyLogs.filter((l) => l.alignmentType === "MONTHLY_LINKED").length;
    const goalAlignedCount = dailyLogs.filter((l) => l.alignmentType === "GOAL_ALIGNED").length;
    const unrelatedCount = dailyLogs.filter((l) => l.alignmentType === "UNRELATED").length;
    const monthlyLinkedPct =
      totalLogs > 0 ? Math.round((monthlyLinkedCount / totalLogs) * 100) : 0;
    const goalAlignedPct = totalLogs > 0 ? Math.round((goalAlignedCount / totalLogs) * 100) : 0;
    const unrelatedPct = totalLogs > 0 ? Math.round((unrelatedCount / totalLogs) * 100) : 0;

    return NextResponse.json({
      // DailyPlan 기반
      totalDailyPlans,
      completedDailyPlans,
      completionRate,
      totalEstimatedMinutes,
      totalActualMinutes,
      timeDiff: totalActualMinutes - totalEstimatedMinutes,

      // 목표별 집계
      byGoal,

      // 월간 계획 현황
      monthlyPlans: monthlyPlans.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        goalTitle: p.goal?.title ?? null,
        categoryColor: p.goal?.category?.color ?? null,
      })),

      // DailyLog 기반
      totalLogs,
      totalLogMinutes,
      monthlyLinkedPct,
      goalAlignedPct,
      unrelatedPct,
    });
  } catch (error) {
    console.error("GET /api/monthly-results error:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}

