"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MonthlyPlan {
  id: string;
  title: string;
  status: "ACTIVE" | "COMPLETED" | "DROPPED";
  goal?: { title: string } | null;
  _count?: { dailyLogs: number };
}

interface DailyLog {
  id: string;
  title: string;
  alignmentType: "MONTHLY_LINKED" | "GOAL_ALIGNED" | "UNRELATED";
  durationMinutes?: number | null;
  monthlyPlan?: { title: string } | null;
  goal?: { title: string } | null;
}

interface DailyPlan {
  id: string;
  title: string;
  completed: boolean;
  monthlyPlan?: { title: string } | null;
  goal?: { title: string } | null;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DashboardPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = toLocalDateString(now);

  const [plans, setPlans] = useState<MonthlyPlan[]>([]);
  const [monthLogs, setMonthLogs] = useState<DailyLog[]>([]);
  const [todayLogs, setTodayLogs] = useState<DailyLog[]>([]);
  const [todayDailyPlans, setTodayDailyPlans] = useState<DailyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllPlans, setShowAllPlans] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/monthly-plans?year=${year}&month=${month}`).then((r) => r.json()),
      fetch(`/api/daily-logs?year=${year}&month=${month}`).then((r) => r.json()),
      fetch(`/api/daily-logs?date=${today}`).then((r) => r.json()),
      fetch(`/api/daily-plans?date=${today}`).then((r) => r.json()),
    ])
      .then(([p, ml, tl, dp]) => {
        setPlans(Array.isArray(p) ? p : []);
        setMonthLogs(Array.isArray(ml) ? ml : []);
        setTodayLogs(Array.isArray(tl) ? tl : []);
        setTodayDailyPlans(Array.isArray(dp) ? dp : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month, today]);

  const totalLogs = monthLogs.length;
  const monthlyLinked = monthLogs.filter((l) => l.alignmentType === "MONTHLY_LINKED").length;
  const goalAligned = monthLogs.filter((l) => l.alignmentType === "GOAL_ALIGNED").length;
  const unrelated = monthLogs.filter((l) => l.alignmentType === "UNRELATED").length;
  const totalMinutes = monthLogs.reduce((s, l) => s + (l.durationMinutes ?? 0), 0);
  const completedPlans = plans.filter((p) => p.status === "COMPLETED").length;

  const pct = (n: number) => (totalLogs > 0 ? Math.round((n / totalLogs) * 100) : 0);

  const todayPlanTotal = todayDailyPlans.length;
  const todayPlanDone = todayDailyPlans.filter((p) => p.completed).length;
  const todayPlanRate = todayPlanTotal > 0 ? Math.round((todayPlanDone / todayPlanTotal) * 100) : 0;

  const alignmentConfig = {
    MONTHLY_LINKED: { icon: "📌", label: "월간연결", color: "bg-blue-100 text-blue-700" },
    GOAL_ALIGNED: { icon: "🎯", label: "목표연관", color: "bg-amber-100 text-amber-700" },
    UNRELATED: { icon: "⬜", label: "기타", color: "bg-zinc-100 text-zinc-500" },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
        <div>
          <h2 className="text-xl font-semibold text-zinc-800">대시보드</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            {now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
          </p>
        </div>
        <Link
          href="/daily"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          📋 오늘 계획/기록
        </Link>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="text-center text-zinc-400 py-20">불러오는 중...</div>
        ) : (
          <div className="max-w-3xl space-y-6">
            {/* Today's plan progress */}
            <div className={`rounded-2xl p-5 border ${
              todayPlanTotal === 0
                ? "bg-white border-zinc-200"
                : todayPlanRate === 100
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-800">오늘 계획 달성률</h3>
                <Link href="/daily" className="text-sm text-blue-600 hover:underline">
                  {todayPlanTotal === 0 ? "🌅 계획 세우기 →" : "상세 보기 →"}
                </Link>
              </div>
              {todayPlanTotal === 0 ? (
                <p className="text-sm text-zinc-400">오늘 계획을 아직 세우지 않았습니다</p>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`text-3xl font-bold ${
                      todayPlanRate === 100 ? "text-green-600" : "text-amber-600"
                    }`}>
                      {todayPlanRate}%
                    </span>
                    <div className="flex-1">
                      <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            todayPlanRate === 100 ? "bg-green-500" : "bg-amber-400"
                          }`}
                          style={{ width: `${todayPlanRate}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {todayPlanDone}/{todayPlanTotal}개 완료
                        {todayPlanRate === 100 && " 🎉"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {todayDailyPlans.map((p) => (
                      <span
                        key={p.id}
                        className={`text-xs px-2 py-1 rounded-full ${
                          p.completed
                            ? "bg-green-100 text-green-700 line-through"
                            : "bg-white border border-zinc-200 text-zinc-600"
                        }`}
                      >
                        {p.completed ? "✓ " : ""}{p.title}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Monthly alignment stats */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-800">
                  {month}월 목표 정렬 현황
                </h3>
                <span className="text-sm text-zinc-400">총 {totalLogs}회 기록</span>
              </div>

              {totalLogs === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-4">이번 달 기록이 없습니다</p>
              ) : (
                <>
                  {/* Progress bar */}
                  <div className="flex h-4 rounded-full overflow-hidden mb-3">
                    {monthlyLinked > 0 && (
                      <div
                        className="bg-blue-500 transition-all"
                        style={{ width: `${pct(monthlyLinked)}%` }}
                        title={`월간연결 ${pct(monthlyLinked)}%`}
                      />
                    )}
                    {goalAligned > 0 && (
                      <div
                        className="bg-amber-400 transition-all"
                        style={{ width: `${pct(goalAligned)}%` }}
                        title={`목표연관 ${pct(goalAligned)}%`}
                      />
                    )}
                    {unrelated > 0 && (
                      <div
                        className="bg-zinc-200 transition-all"
                        style={{ width: `${pct(unrelated)}%` }}
                        title={`기타 ${pct(unrelated)}%`}
                      />
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-zinc-600">📌 월간연결 {pct(monthlyLinked)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-zinc-600">🎯 목표연관 {pct(goalAligned)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-zinc-200 shrink-0" />
                      <span className="text-zinc-600">⬜ 기타 {pct(unrelated)}%</span>
                    </div>
                  </div>

                  {/* Total time */}
                  <div className="mt-4 pt-4 border-t border-zinc-100 text-sm text-zinc-500">
                    이번 달 총 활동 시간:{" "}
                    <span className="font-semibold text-zinc-800">
                      {Math.floor(totalMinutes / 60)}시간 {totalMinutes % 60}분
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Monthly plans progress */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-800">{month}월 계획</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400">{completedPlans}/{plans.length} 완료</span>
                  <Link href="/monthly" className="text-sm text-blue-600 hover:underline">전체 보기 →</Link>
                </div>
              </div>

              {plans.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-4">이번 달 계획이 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {(showAllPlans ? plans : plans.slice(0, 6)).map((plan) => (
                    <div key={plan.id} className="flex items-center gap-3 text-sm">
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                        plan.status === "COMPLETED" ? "bg-blue-600 border-blue-600 text-white" : "border-zinc-300"
                      }`}>
                        {plan.status === "COMPLETED" && <span className="text-xs">✓</span>}
                      </span>
                      <span className={`flex-1 ${plan.status === "COMPLETED" ? "line-through text-zinc-400" : "text-zinc-700"}`}>
                        {plan.title}
                      </span>
                      {plan.goal && (
                        <span className="text-xs text-zinc-400 shrink-0">→ {plan.goal.title}</span>
                      )}
                      <span className="text-xs text-zinc-400 shrink-0">{plan._count?.dailyLogs ?? 0}회</span>
                    </div>
                  ))}
                  {plans.length > 6 && (
                    <button
                      onClick={() => setShowAllPlans((v) => !v)}
                      className="block w-full text-center text-xs text-zinc-400 hover:text-blue-600 mt-2 py-1"
                    >
                      {showAllPlans ? "접기 ↑" : `+${plans.length - 6}개 더 보기 ↓`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Today's logs */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-800">오늘 기록</h3>
                <Link href="/daily" className="text-sm text-blue-600 hover:underline">+ 추가 →</Link>
              </div>

              {todayLogs.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-4">오늘 기록이 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {todayLogs.map((log) => {
                    const config = alignmentConfig[log.alignmentType];
                    return (
                      <div key={log.id} className="flex items-center gap-3 text-sm">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${config.color}`}>
                          {config.icon}
                        </span>
                        <span className="flex-1 text-zinc-700">{log.title}</span>
                        {log.durationMinutes && (
                          <span className="text-xs text-zinc-400 shrink-0">{log.durationMinutes}분</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/review/${year}/${month}`}
                className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all text-center"
              >
                <p className="text-2xl mb-1">📋</p>
                <p className="text-sm font-medium text-zinc-700">{month}월 회고 보기</p>
              </Link>
              <Link
                href="/goals"
                className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all text-center"
              >
                <p className="text-2xl mb-1">🎯</p>
                <p className="text-sm font-medium text-zinc-700">연간 목표 관리</p>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


