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

export default function MorningTab({ date, plans, onRefresh }: MorningTabProps) {
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlan[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customTitle, setCustomTitle] = useState("");
  const [customEstimatedMinutes, setCustomEstimatedMinutes] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  // 예상 시간 편집 중인 계획 id → 임시 값
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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

  // 카테고리별 그룹핑
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

  // 예상 시간 합계 (estimatedMinutes가 있는 항목만)
  const totalEstimatedMinutes = plans.reduce(
    (sum, p) => sum + (p.estimatedMinutes ?? 0),
    0
  );
  const plansWithEst = plans.filter((p) => p.estimatedMinutes != null).length;

  return (
    <div className="p-4 max-w-2xl space-y-6 md:p-6">
      {/* 오늘의 계획 목록 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            📋 오늘의 계획 ({plans.length}개)
          </h3>
          {plansWithEst > 0 && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-medium">
              총 예상 {formatTime(totalEstimatedMinutes)}
            </span>
          )}
        </div>

        {plans.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <p className="text-amber-700 font-medium mb-1">아직 오늘 계획이 없습니다</p>
            <p className="text-sm text-amber-600">아래에서 월간계획을 가져오거나 직접 추가하세요</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const cat = group.category;
              const key = cat?.id ?? "__none__";
              const isCollapsed = collapsedCats.has(key);

              return (
                <div key={key}>
                  {/* 카테고리 헤더 */}
                  <button
                    onClick={() => toggleCat(key)}
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
                        <div
                          key={plan.id}
                          className={`bg-white border rounded-xl px-4 py-3 ${
                            plan.rolledOver ? "border-orange-200 bg-orange-50/40" : "border-zinc-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-800">{plan.title}</p>
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex gap-2">
                                  {plan.monthlyPlan && (
                                    <span className="text-xs text-zinc-400">📅 {plan.monthlyPlan.title}</span>
                                  )}
                                  {plan.rolledOver && (
                                    <span className="text-xs text-orange-500">↩ 넘어온 항목</span>
                                  )}
                                </div>
                                {/* 예상 시간 - 제목 아래 우측 */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    editingEstId === plan.id ? closeEstEditor() : openEstEditor(plan)
                                  }
                                >
                                  {plan.estimatedMinutes != null ? (
                                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors">
                                      ⏱ {formatTime(plan.estimatedMinutes)}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-zinc-300 hover:text-blue-400 transition-colors">
                                      + 예상 시간
                                    </span>
                                  )}
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDelete(plan.id)}
                              className="text-xs text-zinc-300 hover:text-red-400 transition-colors shrink-0"
                            >
                              ✕
                            </button>
                          </div>

                          {/* 예상 시간 인라인 편집기 */}
                          {editingEstId === plan.id && (
                            <div className="mt-3 pt-3 border-t border-zinc-100">
                              <p className="text-xs text-zinc-500 mb-2">예상 소요 시간</p>
                              <TimeInput
                                value={editingEstValue}
                                onChange={setEditingEstValue}
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => saveEstimatedMinutes(plan.id)}
                                  className="flex-1 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  저장
                                </button>
                                <button
                                  type="button"
                                  onClick={closeEstEditor}
                                  className="flex-1 py-1.5 bg-zinc-100 text-zinc-600 text-xs rounded-lg hover:bg-zinc-200 transition-colors"
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
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
            📅 이번 달 계획에서 가져오기
          </h3>
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            {/* 카테고리별 그룹핑 */}
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
                  <div key={cat?.id ?? "__none__"} className={gi > 0 ? "border-t border-zinc-100" : ""}>
                    {/* 카테고리 구분 헤더 */}
                    <div
                      className="flex items-center gap-2 px-4 py-2 sticky top-0 bg-zinc-50"
                      style={{ borderLeft: `3px solid ${cat?.color ?? "#E4E4E7"}` }}
                    >
                      <span className="text-sm">{cat?.icon ?? "📌"}</span>
                      <span className="text-xs font-bold" style={{ color: cat?.color ?? "#6B7280" }}>
                        {cat?.name ?? "미분류"}
                      </span>
                    </div>
                    <div className="divide-y divide-zinc-50">
                      {group.plans.map((mp) => {
                        const isSelected = selectedIds.has(mp.id);
                        return (
                          <label
                            key={mp.id}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50" : "hover:bg-zinc-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(mp.id)}
                              className="rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-zinc-800">{mp.title}</p>
                              {mp.goal && (
                                <p className="text-xs text-zinc-400">→ 🎯 {mp.goal.title}</p>
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
              <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                <button
                  onClick={handleAddFromMonthly}
                  disabled={adding}
                  className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
          ✏️ 직접 추가
        </h3>
        {showCustomForm ? (
          <form onSubmit={handleAddCustom} className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="오늘 할 일 입력..."
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div>
              <p className="text-xs text-zinc-500 mb-1.5">예상 소요 시간 (선택)</p>
              <TimeInput
                value={customEstimatedMinutes}
                onChange={setCustomEstimatedMinutes}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adding || !customTitle.trim()}
                className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {adding ? "추가 중..." : "추가"}
              </button>
              <button
                type="button"
                onClick={() => { setShowCustomForm(false); setCustomTitle(""); setCustomEstimatedMinutes(null); }}
                className="flex-1 py-2 bg-zinc-100 text-zinc-600 text-sm rounded-lg hover:bg-zinc-200 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCustomForm(true)}
            className="w-full py-3 border-2 border-dashed border-zinc-200 rounded-xl text-sm text-zinc-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
          >
            + 월간계획 외 할 일 직접 추가
          </button>
        )}
      </div>
    </div>
  );
}


