import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 주간 뷰 데이터 조회
// Query: startDate=YYYY-MM-DD (주 시작일, 월요일 기준)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");

  if (!startDate) {
    return NextResponse.json({ error: "startDate is required" }, { status: 400 });
  }

  // 7일치 날짜 문자열 생성 (YYYY-MM-DD)
  const weekDates: string[] = [];
  const start = new Date(startDate + "T00:00:00.000Z");
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    weekDates.push(d.toISOString().slice(0, 10));
  }

  try {
    // DailyPlan 전체 조회 후 JS에서 날짜 범위 필터링 (LibSQL DateTime 이슈 대응)
    const allPlans = await prisma.dailyPlan.findMany({
      include: {
        monthlyPlan: { select: { id: true, title: true } },
        goal: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // DailyLog 전체 조회 후 JS에서 날짜 범위 필터링 (LibSQL DateTime 이슈 대응)
    const allLogs = await prisma.dailyLog.findMany({
      include: {
        monthlyPlan: { select: { id: true, title: true } },
        goal: { select: { id: true, title: true } },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    const endDate = weekDates[6];

    const weekPlans = allPlans.filter((p) => {
      const d = new Date(p.date).toISOString().slice(0, 10);
      return d >= startDate && d <= endDate;
    });

    const weekLogs = allLogs.filter((l) => {
      const d = new Date(l.date).toISOString().slice(0, 10);
      return d >= startDate && d <= endDate;
    });

    // 날짜별로 그룹화
    const days = weekDates.map((date) => {
      const plans = weekPlans
        .filter((p) => new Date(p.date).toISOString().slice(0, 10) === date)
        .map((p) => ({
          id: p.id,
          title: p.title,
          completed: p.completed,
          monthlyPlan: p.monthlyPlan ?? null,
          goal: p.goal ?? null,
        }));

      const logs = weekLogs
        .filter((l) => new Date(l.date).toISOString().slice(0, 10) === date)
        .map((l) => ({
          id: l.id,
          title: l.title,
          alignmentType: l.alignmentType as
            | "MONTHLY_LINKED"
            | "GOAL_ALIGNED"
            | "UNRELATED",
          durationMinutes: l.durationMinutes ?? null,
        }));

      const totalPlans = plans.length;
      const completedPlans = plans.filter((p) => p.completed).length;
      const completionRate =
        totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;
      const totalLogMinutes = logs.reduce(
        (sum, l) => sum + (l.durationMinutes ?? 0),
        0
      );

      return {
        date,
        plans,
        logs,
        stats: {
          totalPlans,
          completedPlans,
          completionRate,
          totalLogMinutes,
        },
      };
    });

    // 주간 통계 집계
    const weekTotalPlans = days.reduce((s, d) => s + d.stats.totalPlans, 0);
    const weekCompletedPlans = days.reduce(
      (s, d) => s + d.stats.completedPlans,
      0
    );
    const weekCompletionRate =
      weekTotalPlans > 0
        ? Math.round((weekCompletedPlans / weekTotalPlans) * 100)
        : 0;

    const allWeekLogs = days.flatMap((d) => d.logs);
    const monthlyLinked = allWeekLogs.filter(
      (l) => l.alignmentType === "MONTHLY_LINKED"
    ).length;
    const goalAligned = allWeekLogs.filter(
      (l) => l.alignmentType === "GOAL_ALIGNED"
    ).length;
    const unrelated = allWeekLogs.filter(
      (l) => l.alignmentType === "UNRELATED"
    ).length;
    const totalLogMinutes = allWeekLogs.reduce(
      (s, l) => s + (l.durationMinutes ?? 0),
      0
    );

    return NextResponse.json({
      days,
      weekStats: {
        totalPlans: weekTotalPlans,
        completedPlans: weekCompletedPlans,
        completionRate: weekCompletionRate,
        monthlyLinked,
        goalAligned,
        unrelated,
        totalLogMinutes,
      },
    });
  } catch (error) {
    console.error("GET /api/weekly error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly data" },
      { status: 500 }
    );
  }
}
