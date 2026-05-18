"use client";

import { useState } from "react";
import type { DailyPlan, DailyPlanCategory } from "@/app/daily/page";
import TimeInput, { formatTime } from "@/components/daily/TimeInput";

interface EveningTabProps {
  date: string;
  plans: DailyPlan[];
  onRefresh: () => void;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DEFAULT_AVAILABLE_HOURS = 8;
const LS_KEY = "daily_available_hours";

function loadAvailableHours(): number {
  if (typeof window === "undefined") return DEFAULT_AVAILABLE_HOURS;
  const saved = localStorage.getItem(LS_KEY);
  const parsed = saved !== null ? parseFloat(saved) : NaN;
  return isNaN(parsed) ? DEFAULT_AVAILABLE_HOURS : parsed;
}

export default function EveningTab({ date, plans, onRefresh }: EveningTabProps) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rollingOver, setRollingOver] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actualMinutes, setActualMinutes] = useState<Record<string, number | null>>({});
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [availableHours, setAvailableHours] = useState<number>(() => loadAvailableHours());

  function handleAvailableHoursChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    const h = isNaN(val) || val < 0 ? 0 : val;
    setAvailableHours(h);
    localStorage.setItem(LS_KEY, String(h));
  }

  function toggleCat(key: string) {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const completedPlans = plans.filter((p) => p.completed);
  const pendingPlans = plans.filter((p) => !p.completed && !p.rolledOver);
  const completionRate = plans.length > 0
    ? Math.round((completedPlans.length / plans.length) * 100)
    : 0;

  // 시간 요약 계산
  const completedActualMinutes = completedPlans.reduce(
    (sum, p) => sum + (p.actualMinutes ?? 0),
    0
  );
  const pendingEstMinutes = pendingPlans.reduce(
    (sum, p) => sum + (p.estimatedMinutes ?? 0),
    0
  );
  const availableMinutes = Math.round(availableHours * 60);
  const untrackedMinutes = Math.max(0, availableMinutes - completedActualMinutes - pendingEstMinutes);

  async function handleToggleComplete(plan: DailyPlan) {
    setSavingId(plan.id);
    try {
      const newCompleted = !plan.completed;

      if (newCompleted) {
        const alignmentType = plan.monthlyPlan
          ? "MONTHLY_LINKED"
          : plan.goal
          ? "GOAL_ALIGNED"
          : "UNRELATED";

        const planActualMinutes = actualMinutes[plan.id] ?? null;

        await fetch("/api/daily-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            title: plan.title,
            description: notes[plan.id] || null,
            durationMinutes: planActualMinutes,
            alignmentType,
            monthlyPlanId: plan.monthlyPlan?.id || null,
            goalId: plan.goal?.id || null,
          }),
        });

        await fetch("/api/daily-plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: plan.id,
            completed: true,
            note: notes[plan.id] || null,
            actualMinutes: planActualMinutes,
          }),
        });
      } else {
        await fetch("/api/daily-plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: plan.id,
            completed: false,
            actualMinutes: null,
          }),
        });
      }

      onRefresh();
    } finally {
      setSavingId(null);
    }
  }

  async function handleRollOver() {
    if (pendingPlans.length === 0) return;
    if (!confirm(`미완료 ${pendingPlans.length}개 항목을 내일로 넘길까요?`)) return;

    setRollingOver(true);
    const tomorrow = new Date(date + "T00:00:00");
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = toLocalDateString(tomorrow);

    try {
      await Promise.all(
        pendingPlans.map(async (plan) => {
          await fetch("/api/daily-plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: tomorrowStr,
              title: plan.title,
              monthlyPlanId: plan.monthlyPlan?.id || null,
              goalId: plan.goal?.id || null,
            }),
          });
          await fetch("/api/daily-plans", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: plan.id, rolledOver: true }),
          });
        })
      );
      onRefresh();
    } finally {
      setRollingOver(false);
    }
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <p className="text-4xl mb-3">🌅</p>
        <p className="text-zinc-600 font-medium mb-1">아직 오늘 계획이 없습니다</p>
        <p className="text-sm text-zinc-400">아침 탭에서 오늘 할 일을 먼저 추가해 주세요</p>
      </div>
    );
  }

  // 카테고리별 그룹핑
  function groupByCategory(planList: DailyPlan[]) {
    const grouped = planList.reduce((acc, plan) => {
      const cat = plan.goal?.category ?? null;
      const key = cat?.id ?? "__none__";
      if (!acc[key]) acc[key] = { category: cat, plans: [] };
      acc[key].plans.push(plan);
      return acc;
    }, {} as Record<string, { category: DailyPlanCategory | null; plans: DailyPlan[] }>);

    return Object.values(grouped).sort((a, b) => {
      if (!a.category && b.category) return 1;
      if (a.category && !b.category) return -1;
      return (a.category?.name ?? "").localeCompare(b.category?.name ?? "");
    });
  }

  const pendingGroups = groupByCategory(pendingPlans);
  const completedGroups = groupByCategory(completedPlans);

  // 프로그레스바 너비 계산 (availableMinutes 기준)
  function barWidth(minutes: number): string {
    if (availableMinutes === 0) return "0%";
    return `${Math.min(100, Math.round((minutes / availableMinutes) * 100))}%`;
  }

  return (
    <div className="p-4 max-w-2xl space-y-6 md:p-6">
      {/* 달성률 요약 */}
      <div className={`rounded-2xl p-5 ${
        completionRate === 100
          ? "bg-green-50 border border-green-200"
          : completionRate >= 70
          ? "bg-blue-50 border border-blue-200"
          : "bg-zinc-50 border border-zinc-200"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-zinc-800">오늘 달성률</h3>
          <span className={`text-2xl font-bold ${
            completionRate === 100 ? "text-green-600" :
            completionRate >= 70 ? "text-blue-600" : "text-zinc-600"
          }`}>
            {completionRate}%
          </span>
        </div>
        <div className="w-full h-3 bg-white rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              completionRate === 100 ? "bg-green-500" :
              completionRate >= 70 ? "bg-blue-500" : "bg-zinc-400"
            }`}
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-sm text-zinc-500 mt-2">
          {completedPlans.length}/{plans.length}개 완료
          {completionRate === 100 && " 🎉 오늘 계획 모두 완료!"}
        </p>
      </div>

      {/* 미완료 항목 */}
      {pendingPlans.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
              ⬜ 미완료 ({pendingPlans.length}개)
            </h3>
            <button
              onClick={handleRollOver}
              disabled={rollingOver}
              className="text-xs px-3 py-1.5 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-colors disabled:opacity-50"
            >
              {rollingOver ? "넘기는 중..." : "↩ 미완료 내일로 넘기기"}
            </button>
          </div>

          <div className="space-y-4">
            {pendingGroups.map((group) => {
              const cat = group.category;
              const key = cat?.id ?? "__none__";
              const isCollapsed = collapsedCats.has("pending_" + key);

              return (
                <div key={key}>
                  <button
                    onClick={() => toggleCat("pending_" + key)}
                    className="flex items-center gap-2 w-full mb-2"
                  >
                    <span className="text-base">{cat?.icon ?? "📌"}</span>
                    <span className="text-xs font-bold" style={{ color: cat?.color ?? "#6B7280" }}>
                      {cat?.name ?? "미분류"}
                    </span>
                    <span className="text-xs text-zinc-400">{group.plans.length}개</span>
                    <span
                      className="text-zinc-400 transition-transform duration-200 ml-auto"
                      style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)" }}
                    >
                      ›
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-2 pl-4 border-l-2" style={{ borderColor: cat?.color ? cat.color + "40" : "#E4E4E7" }}>
                      {group.plans.map((plan) => (
                        <div key={plan.id} className="bg-white border border-zinc-200 rounded-xl px-4 py-3">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleToggleComplete(plan)}
                              disabled={savingId === plan.id}
                              className="mt-0.5 w-5 h-5 rounded border-2 border-zinc-300 flex items-center justify-center shrink-0 hover:border-blue-400 transition-colors"
                            >
                              {savingId === plan.id && <span className="text-xs text-zinc-400">...</span>}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-zinc-800">{plan.title}</p>
                                {plan.estimatedMinutes != null && (
                                  <span className="text-xs text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded">
                                    예상 {formatTime(plan.estimatedMinutes)}
                                  </span>
                                )}
                              </div>
                              {plan.monthlyPlan && (
                                <p className="text-xs text-zinc-400 mt-0.5">📅 {plan.monthlyPlan.title}</p>
                              )}
                              {/* 실제 소요 시간 입력 */}
                              <div className="mt-2">
                                <p className="text-xs text-zinc-400 mb-1">실제 소요 시간</p>
                                <TimeInput
                                  value={actualMinutes[plan.id] ?? null}
                                  onChange={(mins) =>
                                    setActualMinutes((prev) => ({ ...prev, [plan.id]: mins }))
                                  }
                                />
                              </div>
                              <input
                                type="text"
                                value={notes[plan.id] ?? ""}
                                onChange={(e) =>
                                  setNotes((prev) => ({ ...prev, [plan.id]: e.target.value }))
                                }
                                placeholder="완료 메모 (선택)..."
                                className="mt-2 w-full text-xs border border-zinc-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-zinc-50"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 완료 항목 */}
      {completedPlans.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
            ✅ 완료 ({completedPlans.length}개)
          </h3>
          <div className="space-y-4">
            {completedGroups.map((group) => {
              const cat = group.category;
              const key = cat?.id ?? "__none__";
              const isCollapsed = collapsedCats.has("done_" + key);

              return (
                <div key={key}>
                  <button
                    onClick={() => toggleCat("done_" + key)}
                    className="flex items-center gap-2 w-full mb-2"
                  >
                    <span className="text-base">{cat?.icon ?? "📌"}</span>
                    <span className="text-xs font-bold" style={{ color: cat?.color ?? "#6B7280" }}>
                      {cat?.name ?? "미분류"}
                    </span>
                    <span className="text-xs text-zinc-400">{group.plans.length}개</span>
                    <span
                      className="text-zinc-400 transition-transform duration-200 ml-auto"
                      style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)" }}
                    >
                      ›
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-2 pl-4 border-l-2" style={{ borderColor: cat?.color ? cat.color + "40" : "#E4E4E7" }}>
                      {group.plans.map((plan) => {
                        const diff =
                          plan.estimatedMinutes != null && plan.actualMinutes != null
                            ? plan.actualMinutes - plan.estimatedMinutes
                            : null;

                        return (
                          <div key={plan.id} className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleComplete(plan)}
                                disabled={savingId === plan.id}
                                className="w-5 h-5 rounded bg-green-500 flex items-center justify-center shrink-0 hover:bg-green-400 transition-colors"
                              >
                                <span className="text-white text-xs">✓</span>
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-800 line-through">{plan.title}</p>
                                {/* 예상 vs 실제 비교 */}
                                {plan.actualMinutes != null && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {plan.estimatedMinutes != null ? (
                                      <>
                                        <span className="text-xs text-zinc-400">
                                          예상 {formatTime(plan.estimatedMinutes)} → 실제{" "}
                                          <span className="font-medium text-green-700">
                                            {formatTime(plan.actualMinutes)}
                                          </span>
                                        </span>
                                        {diff !== null && diff !== 0 && (
                                          <span className={`text-xs font-medium ${diff > 0 ? "text-red-500" : "text-green-600"}`}>
                                            ({diff > 0 ? "+" : ""}{formatTime(Math.abs(diff))} {diff > 0 ? "초과" : "절약"})
                                          </span>
                                        )}
                                        {diff === 0 && (
                                          <span className="text-xs text-blue-500">정확!</span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-xs text-zinc-400">
                                        실제 {formatTime(plan.actualMinutes)}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {plan.note && (
                                  <p className="text-xs text-green-600 mt-0.5">{plan.note}</p>
                                )}
                                {plan.completedAt && (
                                  <p className="text-xs text-green-400 mt-0.5">
                                    {new Date(plan.completedAt).toLocaleTimeString("ko-KR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })} 완료
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 오늘 시간 요약 */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-zinc-700 mb-4">⏱ 오늘 시간 요약</h3>

        {/* 가용 시간 설정 */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-200">
          <span className="text-xs text-zinc-500">가용 시간</span>
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={availableHours}
            onChange={handleAvailableHoursChange}
            className="w-16 border border-zinc-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
          <span className="text-xs text-zinc-500">h</span>
          <span className="text-xs text-zinc-400 ml-1">({formatTime(availableMinutes)})</span>
        </div>

        <div className="space-y-3">
          {/* 계획 완료 (실제) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-600">계획 완료 (실제)</span>
              <span className="text-xs font-medium text-zinc-800">
                {completedActualMinutes > 0 ? formatTime(completedActualMinutes) : "—"}
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: barWidth(completedActualMinutes) }}
              />
            </div>
          </div>

          {/* 미완료 예상 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-600">미완료 예상</span>
              <span className="text-xs font-medium text-zinc-800">
                {pendingEstMinutes > 0 ? formatTime(pendingEstMinutes) : "—"}
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: barWidth(pendingEstMinutes) }}
              />
            </div>
          </div>

          {/* 미파악 시간 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-500">미파악 시간</span>
              <span className={`text-xs font-medium ${untrackedMinutes > 60 ? "text-orange-500" : "text-zinc-500"}`}>
                {untrackedMinutes > 0 ? formatTime(untrackedMinutes) : "0m"}
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-400 rounded-full transition-all"
                style={{ width: barWidth(untrackedMinutes) }}
              />
            </div>
            {untrackedMinutes > 0 && (
              <p className="text-xs text-zinc-400 mt-1">
                가용 {formatTime(availableMinutes)} − 완료 {formatTime(completedActualMinutes)} − 미완료예상 {formatTime(pendingEstMinutes)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


