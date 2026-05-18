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

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  COMPLETED: { label: "완료", cls: "bg-emerald-100 text-emerald-700" },
  ACTIVE: { label: "진행중", cls: "bg-blue-100 text-blue-700" },
  DROPPED: { label: "중단", cls: "bg-zinc-100 text-zinc-500" },
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
      <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
        불러오는 중...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
        데이터를 불러오지 못했습니다.
      </div>
    );
  }

  // 목표별 정렬: actualMinutes 내림차순
  const sortedByGoal = [...data.byGoal].sort((a, b) => b.actualMinutes - a.actualMinutes);
  const maxMinutes = Math.max(...sortedByGoal.map((g) => Math.max(g.estimatedMinutes, g.actualMinutes)), 1);

  // 달성률 색상
  const completionColor =
    data.completionRate >= 100
      ? "text-emerald-600"
      : data.completionRate >= 70
      ? "text-blue-600"
      : "text-zinc-600";

  // 시간 절약/초과
  const timeDiffAbs = Math.abs(data.timeDiff);
  const timeSaved = data.timeDiff < 0; // actual < estimated → 절약
  const timeDiffLabel = timeDiffAbs === 0 ? "차이 없음" : timeSaved ? "절약" : "초과";
  const timeDiffColor =
    timeDiffAbs === 0 ? "text-zinc-500" : timeSaved ? "text-emerald-600" : "text-red-500";

  // 목표 연결 비율
  const alignedPct = data.monthlyLinkedPct + data.goalAlignedPct;

  const completedPlans = data.monthlyPlans.filter((p) => p.status === "COMPLETED");
  const activePlans = data.monthlyPlans.filter((p) => p.status === "ACTIVE");
  const droppedPlans = data.monthlyPlans.filter((p) => p.status === "DROPPED");

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white">
        <Link
          href="/monthly"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          ← {yearNum}년 {monthNum}월 계획
        </Link>
        <Link
          href={`/review/${yearNum}/${monthNum}`}
          className="text-sm text-blue-600 hover:underline"
        >
          📋 AI 회고 →
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <h1 className="text-xl font-bold text-zinc-800">
          {yearNum}년 {monthNum}월 결과
        </h1>

        {/* 섹션 1: 요약 카드 */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {/* 계획 달성률 */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-1">계획 달성률</p>
            <p className={`text-2xl font-bold ${completionColor}`}>
              {data.completionRate}%
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {data.completedDailyPlans}/{data.totalDailyPlans} 완료
            </p>
          </div>

          {/* 총 활동 시간 */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-1">총 활동 시간</p>
            <p className="text-2xl font-bold text-blue-600">
              {data.totalActualMinutes > 0 ? formatTime(data.totalActualMinutes) : "—"}
            </p>
            <p className="text-xs text-zinc-400 mt-1">실제 기록</p>
          </div>

          {/* 목표 연결 */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-1">목표 연결</p>
            <p className="text-2xl font-bold text-amber-600">
              {data.totalLogs > 0 ? `${alignedPct}%` : "—"}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {data.totalLogs > 0 ? `${data.totalLogs}개 활동 중` : "기록 없음"}
            </p>
          </div>

          {/* 시간 절약/초과 */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-1">
              {timeSaved ? "시간 절약" : timeDiffAbs === 0 ? "시간 차이" : "시간 초과"}
            </p>
            <p className={`text-2xl font-bold ${timeDiffColor}`}>
              {timeDiffAbs > 0
                ? `${timeSaved ? "-" : "+"}${formatTime(timeDiffAbs)}`
                : "—"}
            </p>
            <p className="text-xs text-zinc-400 mt-1">{timeDiffLabel}</p>
          </div>
        </div>

        {/* 섹션 2: 목표별 시간 투자 */}
        {sortedByGoal.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-700 mb-4">목표별 시간 투자</h2>
            <div className="space-y-4">
              {sortedByGoal.map((g) => {
                const estBar = maxMinutes > 0 ? (g.estimatedMinutes / maxMinutes) * 100 : 0;
                const actBar = maxMinutes > 0 ? (g.actualMinutes / maxMinutes) * 100 : 0;
                const diff = g.actualMinutes - g.estimatedMinutes;
                const diffAbs = Math.abs(diff);
                const isSaved = diff < 0;
                const noEstimate = g.estimatedMinutes === 0 && g.actualMinutes > 0;

                return (
                  <div key={g.goalId ?? "__none__"}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-zinc-700">
                        {g.categoryIcon} {g.goalTitle}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {g.completed}/{g.total} 완료
                      </span>
                    </div>

                    {noEstimate ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full"
                            style={{ width: `${actBar}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500 shrink-0 w-20 text-right">
                          {formatTime(g.actualMinutes)} 미계획
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {/* 예상 */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400 w-6 shrink-0">예</span>
                          <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-zinc-300 rounded-full"
                              style={{ width: `${estBar}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-400 shrink-0 w-16 text-right">
                            {formatTime(g.estimatedMinutes)}
                          </span>
                        </div>
                        {/* 실제 */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400 w-6 shrink-0">실</span>
                          <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${actBar}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-600 font-medium shrink-0 w-16 text-right">
                            {formatTime(g.actualMinutes)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 차이 뱃지 */}
                    {!noEstimate && diffAbs > 0 && (
                      <div className="mt-1 flex justify-end">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            isSaved
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-500"
                          }`}
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

        {/* 섹션 3: 월간 계획 현황 */}
        {data.monthlyPlans.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-700 mb-1">월간 계획 현황</h2>
            <div className="flex gap-4 text-sm text-zinc-500 mb-4">
              <span>
                <span className="font-semibold text-emerald-600">{completedPlans.length}</span> 완료
              </span>
              <span>
                <span className="font-semibold text-blue-600">{activePlans.length}</span> 진행중
              </span>
              {droppedPlans.length > 0 && (
                <span>
                  <span className="font-semibold text-zinc-400">{droppedPlans.length}</span> 중단
                </span>
              )}
            </div>
            <div className="space-y-2">
              {data.monthlyPlans.map((plan) => {
                const s = STATUS_LABEL[plan.status] ?? STATUS_LABEL.ACTIVE;
                return (
                  <div
                    key={plan.id}
                    className="flex items-center gap-3 py-2 border-b border-zinc-50 last:border-0"
                  >
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${s.cls}`}
                    >
                      {s.label}
                    </span>
                    <span className="text-sm text-zinc-700 flex-1 min-w-0 truncate">
                      {plan.title}
                    </span>
                    {plan.goalTitle && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: plan.categoryColor ? plan.categoryColor + "20" : "#F4F4F5",
                          color: plan.categoryColor ?? "#6B7280",
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
          <div className="text-center py-16 text-zinc-400 text-sm">
            <p className="mb-2">이 달에 기록된 데이터가 없습니다.</p>
            <Link href="/monthly" className="text-blue-500 hover:underline">
              월간 계획으로 이동 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


