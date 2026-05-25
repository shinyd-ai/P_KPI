"use client";

import { useEffect, useMemo, useState } from "react";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

type MonthlyPlanStatus = "ACTIVE" | "COMPLETED" | "PARTIAL" | "MISSED" | "DROPPED";

interface MonthlyPlan {
  id: string;
  year: number;
  month: number;
  title: string;
  description?: string | null;
  status: MonthlyPlanStatus;
  resultMemo?: string | null;
  goalId?: string | null;
  goal?: { id: string; title: string; category?: Category | null } | null;
}

interface ImportItem {
  sourceId: string;
  selected: boolean;
  title: string;
  description: string;
  goalId: string | null;
  goalTitle: string | null;
  category: Category | null;
}

interface MonthlyPlanImportModalProps {
  targetYear: number;
  targetMonth: number;
  existingPlans: MonthlyPlan[];
  onSuccess: () => void;
  onCancel: () => void;
}

function previousMonth(year: number, month: number) {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function duplicateKey(title: string, goalId: string | null) {
  return `${title.trim()}::${goalId ?? "__none__"}`;
}

function isResultOnlyPlan(plan: MonthlyPlan) {
  return plan.title.startsWith("[실적] ");
}

const modalOverlayStyle = {
  background: "rgba(15,23,42,0.5)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
};

const inputClass =
  "rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 focus:bg-white transition-colors";

export default function MonthlyPlanImportModal({
  targetYear,
  targetMonth,
  existingPlans,
  onSuccess,
  onCancel,
}: MonthlyPlanImportModalProps) {
  const previous = previousMonth(targetYear, targetMonth);
  const [sourceYear, setSourceYear] = useState(previous.year);
  const [sourceMonth, setSourceMonth] = useState(previous.month);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const existingKeys = useMemo(() => {
    return new Set(
      existingPlans
        .filter((plan) => !isResultOnlyPlan(plan))
        .map((plan) => duplicateKey(plan.title, plan.goal?.id ?? plan.goalId ?? null))
    );
  }, [existingPlans]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [targetYear - 1, targetYear, targetYear + 1];

  useEffect(() => {
    let ignore = false;

    async function loadSourcePlans() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/monthly-plans?year=${sourceYear}&month=${sourceMonth}`);
        if (!res.ok) throw new Error("가져올 월간 계획을 불러오지 못했습니다");
        const data = await res.json();
        const sourcePlans = Array.isArray(data) ? data.filter((plan: MonthlyPlan) => !isResultOnlyPlan(plan)) : [];
        if (!ignore) {
          setItems(
            sourcePlans.map((plan: MonthlyPlan) => {
              const goalId = plan.goal?.id ?? plan.goalId ?? null;
              const key = duplicateKey(plan.title, goalId);
              return {
                sourceId: plan.id,
                selected: !existingKeys.has(key),
                title: plan.title,
                description: plan.description ?? "",
                goalId,
                goalTitle: plan.goal?.title ?? null,
                category: plan.goal?.category ?? null,
              };
            })
          );
        }
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "오류가 발생했습니다");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadSourcePlans();
    return () => { ignore = true; };
  }, [sourceYear, sourceMonth, existingKeys]);

  const selectedCount = items.filter((item) => item.selected && item.title.trim()).length;

  function updateItem(sourceId: string, patch: Partial<ImportItem>) {
    setItems((prev) => prev.map((item) => item.sourceId === sourceId ? { ...item, ...patch } : item));
  }

  function selectAll() {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.title.trim() ? !existingKeys.has(duplicateKey(item.title, item.goalId)) : false,
      }))
    );
  }

  function clearAll() {
    setItems((prev) => prev.map((item) => ({ ...item, selected: false })));
  }

  async function handleImport() {
    const selectedItems = items.filter((item) => item.selected && item.title.trim());
    if (selectedItems.length === 0) return;

    setSaving(true);
    setError("");
    try {
      for (const item of selectedItems) {
        const res = await fetch("/api/monthly-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year: targetYear,
            month: targetMonth,
            title: item.title.trim(),
            description: item.description.trim() || null,
            goalId: item.goalId,
            status: "ACTIVE",
          }),
        });
        if (!res.ok) throw new Error(`"${item.title}" 생성 실패`);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "가져오기 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={modalOverlayStyle}>
      <div
        className="mx-4 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div>
            <h3 className="text-base font-bold text-slate-800">다른 달에서 가져오기</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {targetYear}년 {targetMonth}월 계획으로 복사하기 전에 필요한 항목만 고르세요.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Source selector */}
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <select
                value={sourceYear}
                onChange={(e) => setSourceYear(parseInt(e.target.value))}
                className={inputClass}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
              <select
                value={sourceMonth}
                onChange={(e) => setSourceMonth(parseInt(e.target.value))}
                className={inputClass}
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
              >
                전체 선택
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                선택 해제
              </button>
            </div>
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
              <span className="spinner" />
              <span className="text-sm">불러오는 중...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">가져올 계획이 없습니다</div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item) => {
                const duplicated = existingKeys.has(duplicateKey(item.title, item.goalId));
                return (
                  <div
                    key={item.sourceId}
                    className="rounded-xl border p-4 transition-all"
                    style={
                      item.selected
                        ? { borderColor: "#c7d2fe", background: "#f5f7ff" }
                        : { borderColor: "rgba(0,0,0,0.07)", background: "#fff" }
                    }
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        disabled={duplicated}
                        onChange={(e) => updateItem(item.sourceId, { selected: e.target.checked })}
                        className="mt-2 rounded accent-indigo-600"
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.category && (
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: item.category.color + "20",
                                color: item.category.color,
                                border: `1px solid ${item.category.color}30`,
                              }}
                            >
                              {item.category.icon} {item.category.name}
                            </span>
                          )}
                          {item.goalTitle && (
                            <span className="text-xs text-slate-400">{item.goalTitle}</span>
                          )}
                          {duplicated && (
                            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              이미 현재 월에 있음
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem(item.sourceId, { title: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => updateItem(item.sourceId, { description: e.target.value })}
                          rows={2}
                          placeholder="설명 없음"
                          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white placeholder:text-slate-300"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          <span className="text-sm text-slate-500">
            선택 <span className="font-bold text-indigo-600">{selectedCount}</span>개
          </span>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={saving || selectedCount === 0}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.01]"
              style={{
                background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                boxShadow: "0 2px 6px rgba(79,124,255,0.3)",
              }}
            >
              {saving ? "생성 중..." : `${targetMonth}월 계획으로 생성`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
