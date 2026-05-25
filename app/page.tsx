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

const cardStyle = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  boxShadow: "var(--card-shadow)",
};

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
    MONTHLY_LINKED: { label: "월간연결", color: "bg-indigo-100 text-indigo-700" },
    GOAL_ALIGNED: { label: "목표연관", color: "bg-amber-100 text-amber-700" },
    UNRELATED: { label: "기타", color: "bg-slate-100 text-slate-500" },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 md:px-6"
        style={{
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">대시보드</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
          </p>
        </div>
        <Link
          href="/daily"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
            boxShadow: "0 2px 8px rgba(79,124,255,0.35)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          오늘 계획/기록
        </Link>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-3 text-slate-400 py-20">
            <span className="spinner" />
            <span className="text-sm">불러오는 중...</span>
          </div>
        ) : (
          <div className="max-w-3xl space-y-4 fade-in">
            {/* Today's plan progress */}
            <div
              className="rounded-2xl p-5 transition-all duration-200"
              style={{
                ...(todayPlanTotal === 0
                  ? cardStyle
                  : todayPlanRate === 100
                  ? { background: "linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)", border: "1px solid #a7f3d0", boxShadow: "0 2px 8px rgba(16,185,129,0.12)" }
                  : { background: "linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)", border: "1px solid #fde68a", boxShadow: "0 2px 8px rgba(245,158,11,0.12)" }),
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 text-sm">오늘 계획 달성률</h3>
                <Link
                  href="/daily"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {todayPlanTotal === 0 ? "계획 세우기 →" : "상세 보기 →"}
                </Link>
              </div>
              {todayPlanTotal === 0 ? (
                <p className="text-sm text-slate-400">오늘 계획을 아직 세우지 않았습니다</p>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-3">
                    <span className={`text-3xl font-black tracking-tight ${
                      todayPlanRate === 100 ? "text-emerald-600" : "text-amber-600"
                    }`}>
                      {todayPlanRate}%
                    </span>
                    <div className="flex-1">
                      <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${todayPlanRate}%`,
                            background: todayPlanRate === 100
                              ? "linear-gradient(90deg, #10b981, #059669)"
                              : "linear-gradient(90deg, #f59e0b, #d97706)",
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {todayPlanDone}/{todayPlanTotal}개 완료
                        {todayPlanRate === 100 && " — 완벽!"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {todayDailyPlans.map((p) => (
                      <span
                        key={p.id}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                          p.completed
                            ? "bg-emerald-500/15 text-emerald-700 line-through"
                            : "bg-white/70 border border-white/80 text-slate-600"
                        }`}
                      >
                        {p.completed && (
                          <span className="mr-0.5">✓</span>
                        )}
                        {p.title}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Monthly alignment stats */}
            <div className="rounded-2xl p-5 transition-all duration-200 hover:shadow-md" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 text-sm">{month}월 목표 정렬 현황</h3>
                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">총 {totalLogs}회 기록</span>
              </div>

              {totalLogs === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">이번 달 기록이 없습니다</p>
              ) : (
                <>
                  {/* Progress bar */}
                  <div className="flex h-3 rounded-full overflow-hidden mb-3 bg-slate-100">
                    {monthlyLinked > 0 && (
                      <div
                        className="transition-all duration-700"
                        style={{
                          width: `${pct(monthlyLinked)}%`,
                          background: "linear-gradient(90deg, #6366f1, #818cf8)",
                        }}
                        title={`월간연결 ${pct(monthlyLinked)}%`}
                      />
                    )}
                    {goalAligned > 0 && (
                      <div
                        className="transition-all duration-700"
                        style={{
                          width: `${pct(goalAligned)}%`,
                          background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                        }}
                        title={`목표연관 ${pct(goalAligned)}%`}
                      />
                    )}
                    {unrelated > 0 && (
                      <div
                        className="bg-slate-200 transition-all duration-700"
                        style={{ width: `${pct(unrelated)}%` }}
                        title={`기타 ${pct(unrelated)}%`}
                      />
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }} />
                      <span className="text-slate-600">월간연결 {pct(monthlyLinked)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }} />
                      <span className="text-slate-600">목표연관 {pct(goalAligned)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200 shrink-0" />
                      <span className="text-slate-600">기타 {pct(unrelated)}%</span>
                    </div>
                  </div>

                  {/* Total time */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">이번 달 총 활동 시간</span>
                    <span className="text-sm font-bold text-slate-700">
                      {Math.floor(totalMinutes / 60)}시간 {totalMinutes % 60}분
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Monthly plans progress */}
            <div className="rounded-2xl p-5 transition-all duration-200 hover:shadow-md" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 text-sm">{month}월 계획</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{completedPlans}/{plans.length} 완료</span>
                  <Link href="/monthly" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                    전체 보기 →
                  </Link>
                </div>
              </div>

              {plans.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">이번 달 계획이 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {(showAllPlans ? plans : plans.slice(0, 6)).map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center gap-3 text-sm py-0.5"
                    >
                      <span
                        className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          plan.status === "COMPLETED"
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-slate-200"
                        }`}
                      >
                        {plan.status === "COMPLETED" && (
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                            <polyline points="2 6 5 9 10 3" />
                          </svg>
                        )}
                      </span>
                      <span className={`flex-1 truncate ${plan.status === "COMPLETED" ? "line-through text-slate-400" : "text-slate-700"}`}>
                        {plan.title}
                      </span>
                      {plan.goal && (
                        <span className="text-xs text-slate-400 shrink-0 hidden sm:inline">→ {plan.goal.title}</span>
                      )}
                      <span className="text-xs text-slate-300 shrink-0">{plan._count?.dailyLogs ?? 0}회</span>
                    </div>
                  ))}
                  {plans.length > 6 && (
                    <button
                      onClick={() => setShowAllPlans((v) => !v)}
                      className="block w-full text-center text-xs text-slate-400 hover:text-indigo-600 mt-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      {showAllPlans ? "접기 ↑" : `+${plans.length - 6}개 더 보기 ↓`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Today's logs */}
            <div className="rounded-2xl p-5 transition-all duration-200 hover:shadow-md" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 text-sm">오늘 기록</h3>
                <Link href="/daily" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  + 추가 →
                </Link>
              </div>

              {todayLogs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">오늘 기록이 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {todayLogs.map((log) => {
                    const config = alignmentConfig[log.alignmentType];
                    return (
                      <div key={log.id} className="flex items-center gap-3 text-sm py-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="flex-1 truncate text-slate-700">{log.title}</span>
                        {log.durationMinutes && (
                          <span className="text-xs text-slate-400 shrink-0">{log.durationMinutes}분</span>
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
                className="rounded-2xl p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md text-center group"
                style={cardStyle}
              >
                <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{month}월 회고 보기</p>
              </Link>
              <Link
                href="/goals"
                className="rounded-2xl p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md text-center group"
                style={cardStyle}
              >
                <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4" />
                    <line x1="12" y1="2" x2="12" y2="4" />
                    <line x1="12" y1="20" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="4" y2="12" />
                    <line x1="20" y1="12" x2="22" y2="12" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700 group-hover:text-amber-600 transition-colors">연간 목표 관리</p>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
