"use client";

import { useState, useEffect } from "react";
import type { DailyPlan, DailyPlanCategory } from "@/app/daily/page";
import TimeInput, { formatTime } from "@/components/daily/TimeInput";

interface MonthlyPlan {
  id: string;
  title: string;
  goal?: { id: string; title: string; category?: DailyPlanCategory | null } | null;
  status: string;
}

interface MorningTabProps {
  date: string;
  plans: DailyPlan[];
  onRefresh: () => void;
}

const cardStyle = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  boxShadow: "var(--card-shadow)",
};

export default function MorningTab({ date, plans, onRefresh }: MorningTabProps) {
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlan[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customTitle, setCustomTitle] = useState("");
  const [customEstimatedMinutes, setCustomEstimatedMinutes] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [editingEstId, setEditingEstId] = useState<string | null>(null);
  const [editingEstValue, setEditingEstValue] = useState<number | null>(null);

  const alreadyAddedPlanIds = new Set(
    plans.filter((p) => p.monthlyPlan).map((p) => p.monthlyPlan!.id)
  );

  const d = new Date(date + "T00:00:00");
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  useEffect(() => {
    fetch(`/api/monthly-plans?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) =>
        setMonthlyPlans(data.filter((p: MonthlyPlan) => p.status === "ACTIVE"))
      );
  }, [year, month]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCat(key: string) {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function openEstEditor(plan: DailyPlan) {
    setEditingEstId(plan.id);
    setEditingEstValue(plan.estimatedMinutes ?? null);
  }

  function closeEstEditor() {
    setEditingEstId(null);
    setEditingEstValue(null);
  }

  async function saveEstimatedMinutes(planId: string) {
    await fetch("/api/daily-plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: planId, estimatedMinutes: editingEstValue }),
    });
    closeEstEditor();
    onRefresh();
  }

  async function handleAddFromMonthly() {
    if (selectedIds.size === 0) return;
    setAdding(true);
    try {
      await fetch("/api/daily-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, fromMonthlyPlanIds: [...selectedIds] }),
      });
      setSelectedIds(new Set());
      onRefresh();
    } finally {
      setAdding(false);
    }
  }

  async function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!customTitle.trim()) return;
    setAdding(true);
    try {
      await fetch("/api/daily-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          title: customTitle.trim(),
          estimatedMinutes: customEstimatedMinutes,
        }),
      });
      setCustomTitle("");
      setCustomEstimatedMinutes(null);
      setShowCustomForm(false);
      onRefresh();
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/daily-plans?id=${id}`, { method: "DELETE" });
    onRefresh();
  }

  const availableMonthlyPlans = monthlyPlans.filter(
    (mp) => !alreadyAddedPlanIds.has(mp.id)
  );

  const grouped = plans.reduce((acc, plan) => {
    const cat = plan.goal?.category ?? null;
    const key = cat?.id ?? "__none__";
    if (!acc[key]) acc[key] = { category: cat, plans: [] };
    acc[key].plans.push(plan);
    return acc;
  }, {} as Record<string, { category: DailyPlanCategory | null; plans: DailyPlan[] }>);

  const groups = Object.values(grouped).sort((a, b) => {
    if (!a.category && b.category) return 1;
    if (a.category && !b.category) return -1;
    return (a.category?.name ?? "").localeCompare(b.category?.name ?? "");
  });

  const totalEstimatedMinutes = plans.reduce(
    (sum, p) => sum + (p.estimatedMinutes ?? 0),
    0
  );
  const plansWithEst = plans.filter((p) => p.estimatedMinutes != null).length;

  return (
    <div className="p-4 max-w-2xl space-y-5 md:p-6">
      {/* 오늘의 계획 목록 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            오늘의 계획 ({plans.length}개)
          </h3>
          {plansWithEst > 0 && (
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: "linear-gradient(135deg, #e0e7ff, #ddd6fe)", color: "#6366f1" }}
            >
              총 예상 {formatTime(totalEstimatedMinutes)}
            </span>
          )}
        </div>

        {plans.length === 0 ? (
          <div className="rounded-2xl p-6 text-center"
            style={{ background: "linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)", border: "1px solid #fde68a" }}>
            <p className="text-amber-700 font-semibold mb-1">아직 오늘 계획이 없습니다</p>
            <p className="text-sm text-amber-600/80">아래에서 월간계획을 가져오거나 직접 추가하세요</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const cat = group.category;
              const key = cat?.id ?? "__none__";
              const isCollapsed = collapsedCats.has(key);

              return (
                <div key={key}>
                  <button
                    onClick={() => toggleCat(key)}
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
                        <div
                          key={plan.id}
                          className="rounded-xl px-4 py-3 transition-all duration-200"
                          style={
                            plan.rolledOver
                              ? { background: "#fff7ed", border: "1px solid #fed7aa" }
                              : cardStyle
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800">{plan.title}</p>
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex gap-2 items-center">
                                  {plan.monthlyPlan && (
                                    <span className="text-xs text-slate-400">{plan.monthlyPlan.title}</span>
                                  )}
                                  {plan.rolledOver && (
                                    <span className="text-xs text-orange-500 font-medium">↩ 넘어온 항목</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    editingEstId === plan.id ? closeEstEditor() : openEstEditor(plan)
                                  }
                                >
                                  {plan.estimatedMinutes != null ? (
                                    <span
                                      className="text-xs px-2 py-0.5 rounded-full border font-medium hover:opacity-80 transition-opacity"
                                      style={{ background: "#e0e7ff", color: "#6366f1", borderColor: "#c7d2fe" }}
                                    >
                                      {formatTime(plan.estimatedMinutes)}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-300 hover:text-indigo-400 transition-colors">
                                      + 예상 시간
                                    </span>
                                  )}
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDelete(plan.id)}
                              className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors shrink-0 rounded-lg hover:bg-red-50"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>

                          {editingEstId === plan.id && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <p className="text-xs text-slate-400 mb-2">예상 소요 시간</p>
                              <TimeInput
                                value={editingEstValue}
                                onChange={setEditingEstValue}
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => saveEstimatedMinutes(plan.id)}
                                  className="flex-1 py-1.5 text-white text-xs rounded-xl transition-all hover:scale-[1.01]"
                                  style={{
                                    background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                                    boxShadow: "0 1px 4px rgba(79,124,255,0.3)",
                                  }}
                                >
                                  저장
                                </button>
                                <button
                                  type="button"
                                  onClick={closeEstEditor}
                                  className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 월간계획에서 가져오기 */}
      {availableMonthlyPlans.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            이번 달 계획에서 가져오기
          </h3>
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            {(() => {
              const grouped = availableMonthlyPlans.reduce((acc, mp) => {
                const cat = mp.goal?.category ?? null;
                const key = cat?.id ?? "__none__";
                if (!acc[key]) acc[key] = { category: cat, plans: [] };
                acc[key].plans.push(mp);
                return acc;
              }, {} as Record<string, { category: DailyPlanCategory | null; plans: MonthlyPlan[] }>);

              const groups = Object.values(grouped).sort((a, b) => {
                if (!a.category && b.category) return 1;
                if (a.category && !b.category) return -1;
                return (a.category?.name ?? "").localeCompare(b.category?.name ?? "");
              });

              return groups.map((group, gi) => {
                const cat = group.category;
                return (
                  <div key={cat?.id ?? "__none__"} className={gi > 0 ? "border-t border-slate-100" : ""}>
                    <div
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50"
                      style={{ borderLeft: `3px solid ${cat?.color ?? "#E2E8F0"}` }}
                    >
                      <span className="text-sm">{cat?.icon ?? "📌"}</span>
                      <span className="text-xs font-bold" style={{ color: cat?.color ?? "#6B7280" }}>
                        {cat?.name ?? "미분류"}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {group.plans.map((mp) => {
                        const isSelected = selectedIds.has(mp.id);
                        return (
                          <label
                            key={mp.id}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                              isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(mp.id)}
                              className="rounded accent-indigo-600"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-800">{mp.title}</p>
                              {mp.goal && (
                                <p className="text-xs text-slate-400">{mp.goal.title}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}

            {selectedIds.size > 0 && (
              <div className="px-4 py-3" style={{ background: "#e0e7ff", borderTop: "1px solid #c7d2fe" }}>
                <button
                  onClick={handleAddFromMonthly}
                  disabled={adding}
                  className="w-full py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-all hover:scale-[1.01]"
                  style={{
                    background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                    boxShadow: "0 2px 6px rgba(79,124,255,0.3)",
                  }}
                >
                  {adding ? "추가 중..." : `선택한 ${selectedIds.size}개 오늘 계획에 추가`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 직접 추가 */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          직접 추가
        </h3>
        {showCustomForm ? (
          <form
            onSubmit={handleAddCustom}
            className="rounded-2xl p-4 space-y-3"
            style={cardStyle}
          >
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="오늘 할 일 입력..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 focus:bg-white transition-colors placeholder:text-slate-300"
              autoFocus
            />
            <div>
              <p className="text-xs text-slate-400 mb-1.5 font-medium">예상 소요 시간 (선택)</p>
              <TimeInput
                value={customEstimatedMinutes}
                onChange={setCustomEstimatedMinutes}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adding || !customTitle.trim()}
                className="flex-1 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all hover:scale-[1.01]"
                style={{
                  background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                  boxShadow: "0 1px 4px rgba(79,124,255,0.3)",
                }}
              >
                {adding ? "추가 중..." : "추가"}
              </button>
              <button
                type="button"
                onClick={() => { setShowCustomForm(false); setCustomTitle(""); setCustomEstimatedMinutes(null); }}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCustomForm(true)}
            className="w-full py-3.5 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all"
          >
            + 월간계획 외 할 일 직접 추가
          </button>
        )}
      </div>
    </div>
  );
}
