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

const cardStyle = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  boxShadow: "var(--card-shadow)",
};

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
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const completedPlans = plans.filter((p) => p.completed);
  const pendingPlans = plans.filter((p) => !p.completed && !p.rolledOver);
  const completionRate = plans.length > 0
    ? Math.round((completedPlans.length / plans.length) * 100)
    : 0;

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
        <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" }}>
          <span className="text-3xl">🌅</span>
        </div>
        <p className="text-slate-700 font-semibold mb-1">아직 오늘 계획이 없습니다</p>
        <p className="text-sm text-slate-400">아침 탭에서 오늘 할 일을 먼저 추가해 주세요</p>
      </div>
    );
  }

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

  function barWidth(minutes: number): string {
    if (availableMinutes === 0) return "0%";
    return `${Math.min(100, Math.round((minutes / availableMinutes) * 100))}%`;
  }

  return (
    <div className="p-4 max-w-2xl space-y-5 md:p-6">
      {/* 달성률 요약 */}
      <div
        className="rounded-2xl p-5"
        style={
          completionRate === 100
            ? { background: "linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)", border: "1px solid #a7f3d0", boxShadow: "0 2px 8px rgba(16,185,129,0.12)" }
            : completionRate >= 70
            ? { background: "linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)", border: "1px solid #c7d2fe", boxShadow: "0 2px 8px rgba(99,102,241,0.10)" }
            : { background: "var(--card-bg)", border: "1px solid var(--card-border)", boxShadow: "var(--card-shadow)" }
        }
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-sm">오늘 달성률</h3>
          <span className={`text-2xl font-black tracking-tight ${
            completionRate === 100 ? "text-emerald-600" :
            completionRate >= 70 ? "text-indigo-600" : "text-slate-600"
          }`}>
            {completionRate}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.6)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${completionRate}%`,
              background: completionRate === 100
                ? "linear-gradient(90deg, #10b981, #059669)"
                : completionRate >= 70
                ? "linear-gradient(90deg, #6366f1, #818cf8)"
                : "linear-gradient(90deg, #94a3b8, #cbd5e1)",
            }}
          />
        </div>
        <p className="text-sm text-slate-500 mt-2">
          {completedPlans.length}/{plans.length}개 완료
          {completionRate === 100 && (
            <span className="ml-2 text-emerald-600 font-semibold">오늘 계획 모두 완료!</span>
          )}
        </p>
      </div>

      {/* 미완료 항목 */}
      {pendingPlans.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              미완료 ({pendingPlans.length}개)
            </h3>
            <button
              onClick={handleRollOver}
              disabled={rollingOver}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-all disabled:opacity-50"
              style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}
            >
              {rollingOver ? "넘기는 중..." : "↩ 내일로 넘기기"}
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
                    <span className="text-xs text-slate-400">{group.plans.length}개</span>
                    <span
                      className="text-slate-400 transition-transform duration-200 ml-auto"
                      style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)" }}
                    >
                      ›
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div
                      className="space-y-2 pl-4 border-l-2"
                      style={{ borderColor: cat?.color ? cat.color + "30" : "rgba(0,0,0,0.07)" }}
                    >
                      {group.plans.map((plan) => (
                        <div key={plan.id} className="rounded-xl px-4 py-3" style={cardStyle}>
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleToggleComplete(plan)}
                              disabled={savingId === plan.id}
                              className="mt-0.5 w-5 h-5 rounded-md border-2 border-slate-300 flex items-center justify-center shrink-0 hover:border-indigo-400 transition-colors"
                            >
                              {savingId === plan.id && (
                                <span className="w-2.5 h-2.5 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-800">{plan.title}</p>
                                {plan.estimatedMinutes != null && (
                                  <span className="text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-lg">
                                    {formatTime(plan.estimatedMinutes)}
                                  </span>
                                )}
                              </div>
                              {plan.monthlyPlan && (
                                <p className="text-xs text-slate-400 mt-0.5">{plan.monthlyPlan.title}</p>
                              )}
                              <div className="mt-2">
                                <p className="text-xs text-slate-400 mb-1">실제 소요 시간</p>
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
                                className="mt-2 w-full text-xs border border-slate-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-slate-50 placeholder:text-slate-300"
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
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            완료 ({completedPlans.length}개)
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
                    <span className="text-xs text-slate-400">{group.plans.length}개</span>
                    <span
                      className="text-slate-400 transition-transform duration-200 ml-auto"
                      style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)" }}
                    >
                      ›
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div
                      className="space-y-2 pl-4 border-l-2"
                      style={{ borderColor: cat?.color ? cat.color + "30" : "rgba(0,0,0,0.07)" }}
                    >
                      {group.plans.map((plan) => {
                        const diff =
                          plan.estimatedMinutes != null && plan.actualMinutes != null
                            ? plan.actualMinutes - plan.estimatedMinutes
                            : null;

                        return (
                          <div
                            key={plan.id}
                            className="rounded-xl px-4 py-3"
                            style={{
                              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                              border: "1px solid #bbf7d0",
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleComplete(plan)}
                                disabled={savingId === plan.id}
                                className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center shrink-0 hover:bg-emerald-400 transition-colors"
                              >
                                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                                  <polyline points="2 6 5 9 10 3" />
                                </svg>
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-emerald-800 line-through">{plan.title}</p>
                                {plan.actualMinutes != null && (
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    {plan.estimatedMinutes != null ? (
                                      <>
                                        <span className="text-xs text-slate-500">
                                          예상 {formatTime(plan.estimatedMinutes)} → 실제{" "}
                                          <span className="font-semibold text-emerald-700">
                                            {formatTime(plan.actualMinutes)}
                                          </span>
                                        </span>
                                        {diff !== null && diff !== 0 && (
                                          <span className={`text-xs font-semibold ${diff > 0 ? "text-red-500" : "text-emerald-600"}`}>
                                            ({diff > 0 ? "+" : ""}{formatTime(Math.abs(diff))} {diff > 0 ? "초과" : "절약"})
                                          </span>
                                        )}
                                        {diff === 0 && (
                                          <span className="text-xs text-indigo-500 font-semibold">정확!</span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-xs text-slate-400">
                                        실제 {formatTime(plan.actualMinutes)}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {plan.note && (
                                  <p className="text-xs text-emerald-600 mt-0.5">{plan.note}</p>
                                )}
                                {plan.completedAt && (
                                  <p className="text-xs text-emerald-400 mt-0.5">
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
      <div className="rounded-2xl p-5" style={cardStyle}>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">오늘 시간 요약</h3>

        <div className="flex items-center gap-2 mb-4 pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <span className="text-xs text-slate-500 font-medium">가용 시간</span>
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={availableHours}
            onChange={handleAvailableHoursChange}
            className="w-16 border border-slate-200 rounded-xl px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
          />
          <span className="text-xs text-slate-400">h</span>
          <span className="text-xs text-slate-400">({formatTime(availableMinutes)})</span>
        </div>

        <div className="space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-600 font-medium">계획 완료 (실제)</span>
              <span className="text-xs font-bold text-slate-800">
                {completedActualMinutes > 0 ? formatTime(completedActualMinutes) : "—"}
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: barWidth(completedActualMinutes),
                  background: "linear-gradient(90deg, #10b981, #059669)",
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-600 font-medium">미완료 예상</span>
              <span className="text-xs font-bold text-slate-800">
                {pendingEstMinutes > 0 ? formatTime(pendingEstMinutes) : "—"}
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: barWidth(pendingEstMinutes),
                  background: "linear-gradient(90deg, #f59e0b, #d97706)",
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">미파악 시간</span>
              <span className={`text-xs font-bold ${untrackedMinutes > 60 ? "text-orange-500" : "text-slate-500"}`}>
                {untrackedMinutes > 0 ? formatTime(untrackedMinutes) : "0m"}
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
              <div
                className="h-full bg-slate-300 rounded-full transition-all duration-500"
                style={{ width: barWidth(untrackedMinutes) }}
              />
            </div>
            {untrackedMinutes > 0 && (
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                가용 {formatTime(availableMinutes)} − 완료 {formatTime(completedActualMinutes)} − 미완료예상 {formatTime(pendingEstMinutes)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
