"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import { formatTime } from "@/components/daily/TimeInput";

interface ByGoalItem {
  goalId: string | null;
  goalTitle: string;
  categoryIcon: string;
  estimatedMinutes: number;
  actualMinutes: number;
  completed: number;
  total: number;
}

interface MonthlyPlanItem {
  id: string;
  title: string;
  status: string;
  goalTitle?: string | null;
  categoryColor?: string | null;
}

interface MonthlyResults {
  totalDailyPlans: number;
  completedDailyPlans: number;
  completionRate: number;
  totalEstimatedMinutes: number;
  totalActualMinutes: number;
  timeDiff: number;
  byGoal: ByGoalItem[];
  monthlyPlans: MonthlyPlanItem[];
  totalLogs: number;
  totalLogMinutes: number;
  monthlyLinkedPct: number;
  goalAlignedPct: number;
  unrelatedPct: number;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: "완료", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  ACTIVE: { label: "진행중", className: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  DROPPED: { label: "중단", className: "bg-slate-100 text-slate-500 border border-slate-200" },
};

const cardStyle = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  boxShadow: "var(--card-shadow)",
};

export default function MonthlyResultPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { year, month } = use(params);
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);

  const [data, setData] = useState<MonthlyResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/monthly-results?year=${yearNum}&month=${monthNum}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [yearNum, monthNum]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-3 text-slate-400">
        <span className="spinner" />
        <span className="text-sm">불러오는 중...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        데이터를 불러오지 못했습니다.
      </div>
    );
  }

  const sortedByGoal = [...data.byGoal].sort((a, b) => b.actualMinutes - a.actualMinutes);
  const maxMinutes = Math.max(...sortedByGoal.map((g) => Math.max(g.estimatedMinutes, g.actualMinutes)), 1);

  const completionColor =
    data.completionRate >= 100
      ? "text-emerald-600"
      : data.completionRate >= 70
      ? "text-indigo-600"
      : "text-slate-600";

  const timeDiffAbs = Math.abs(data.timeDiff);
  const timeSaved = data.timeDiff < 0;
  const timeDiffLabel = timeDiffAbs === 0 ? "차이 없음" : timeSaved ? "절약" : "초과";
  const timeDiffColor =
    timeDiffAbs === 0 ? "text-slate-500" : timeSaved ? "text-emerald-600" : "text-red-500";

  const alignedPct = data.monthlyLinkedPct + data.goalAlignedPct;

  const completedPlans = data.monthlyPlans.filter((p) => p.status === "COMPLETED");
  const activePlans = data.monthlyPlans.filter((p) => p.status === "ACTIVE");
  const droppedPlans = data.monthlyPlans.filter((p) => p.status === "DROPPED");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 md:px-6"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <Link
          href="/monthly"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {yearNum}년 {monthNum}월 계획
        </Link>
        <Link
          href={`/review/${yearNum}/${monthNum}`}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          AI 회고 →
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
          {yearNum}년 {monthNum}월 결과
        </h1>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 fade-in">
          <div className="rounded-2xl p-4" style={cardStyle}>
            <p className="text-xs text-slate-400 mb-1 font-medium">계획 달성률</p>
            <p className={`text-2xl font-black ${completionColor}`}>
              {data.completionRate}%
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {data.completedDailyPlans}/{data.totalDailyPlans} 완료
            </p>
          </div>
          <div className="rounded-2xl p-4" style={cardStyle}>
            <p className="text-xs text-slate-400 mb-1 font-medium">총 활동 시간</p>
            <p className="text-2xl font-black text-indigo-600">
              {data.totalActualMinutes > 0 ? formatTime(data.totalActualMinutes) : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-1">실제 기록</p>
          </div>
          <div className="rounded-2xl p-4" style={cardStyle}>
            <p className="text-xs text-slate-400 mb-1 font-medium">목표 연결</p>
            <p className="text-2xl font-black text-amber-600">
              {data.totalLogs > 0 ? `${alignedPct}%` : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {data.totalLogs > 0 ? `${data.totalLogs}개 활동 중` : "기록 없음"}
            </p>
          </div>
          <div className="rounded-2xl p-4" style={cardStyle}>
            <p className="text-xs text-slate-400 mb-1 font-medium">
              {timeSaved ? "시간 절약" : timeDiffAbs === 0 ? "시간 차이" : "시간 초과"}
            </p>
            <p className={`text-2xl font-black ${timeDiffColor}`}>
              {timeDiffAbs > 0
                ? `${timeSaved ? "-" : "+"}${formatTime(timeDiffAbs)}`
                : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-1">{timeDiffLabel}</p>
          </div>
        </div>

        {/* 목표별 시간 투자 */}
        {sortedByGoal.length > 0 && (
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">목표별 시간 투자</h2>
            <div className="space-y-5">
              {sortedByGoal.map((g) => {
                const estBar = maxMinutes > 0 ? (g.estimatedMinutes / maxMinutes) * 100 : 0;
                const actBar = maxMinutes > 0 ? (g.actualMinutes / maxMinutes) * 100 : 0;
                const diff = g.actualMinutes - g.estimatedMinutes;
                const diffAbs = Math.abs(diff);
                const isSaved = diff < 0;
                const noEstimate = g.estimatedMinutes === 0 && g.actualMinutes > 0;

                return (
                  <div key={g.goalId ?? "__none__"}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700">
                        {g.categoryIcon} {g.goalTitle}
                      </span>
                      <span className="text-xs text-slate-400">
                        {g.completed}/{g.total} 완료
                      </span>
                    </div>

                    {noEstimate ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${actBar}%`,
                              background: "linear-gradient(90deg, #6366f1, #818cf8)",
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 shrink-0 w-24 text-right">
                          {formatTime(g.actualMinutes)} (미계획)
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 w-5 shrink-0 font-medium">예</span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                            <div
                              className="h-full bg-slate-300 rounded-full"
                              style={{ width: `${estBar}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 shrink-0 w-14 text-right">
                            {formatTime(g.estimatedMinutes)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 w-5 shrink-0 font-medium">실</span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${actBar}%`,
                                background: "linear-gradient(90deg, #6366f1, #818cf8)",
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 shrink-0 w-14 text-right">
                            {formatTime(g.actualMinutes)}
                          </span>
                        </div>
                      </div>
                    )}

                    {!noEstimate && diffAbs > 0 && (
                      <div className="mt-1.5 flex justify-end">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={
                            isSaved
                              ? { background: "#dcfce7", color: "#15803d" }
                              : { background: "#fee2e2", color: "#dc2626" }
                          }
                        >
                          {isSaved ? "-" : "+"}{formatTime(diffAbs)} {isSaved ? "절약" : "초과"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 월간 계획 현황 */}
        {data.monthlyPlans.length > 0 && (
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">월간 계획 현황</h2>
            <div className="flex gap-4 text-sm mb-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-emerald-600">{completedPlans.length}</span>
                <span className="text-slate-400">완료</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="font-bold text-indigo-600">{activePlans.length}</span>
                <span className="text-slate-400">진행중</span>
              </span>
              {droppedPlans.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="font-bold text-slate-400">{droppedPlans.length}</span>
                  <span className="text-slate-400">중단</span>
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {data.monthlyPlans.map((plan) => {
                const s = STATUS_CONFIG[plan.status] ?? STATUS_CONFIG.ACTIVE;
                return (
                  <div
                    key={plan.id}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${s.className}`}>
                      {s.label}
                    </span>
                    <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">
                      {plan.title}
                    </span>
                    {plan.goalTitle && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                        style={{
                          backgroundColor: plan.categoryColor ? plan.categoryColor + "20" : "#f1f5f9",
                          color: plan.categoryColor ?? "#64748b",
                          border: `1px solid ${plan.categoryColor ? plan.categoryColor + "30" : "rgba(0,0,0,0.07)"}`,
                        }}
                      >
                        {plan.goalTitle}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 데이터 없음 */}
        {data.totalDailyPlans === 0 && data.monthlyPlans.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-sm">
            <p className="mb-3">이 달에 기록된 데이터가 없습니다.</p>
            <Link
              href="/monthly"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              월간 계획으로 이동 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
