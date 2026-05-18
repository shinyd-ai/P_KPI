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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-800">다른 달에서 가져오기</h3>
            <p className="mt-0.5 text-sm text-zinc-400">
              {targetYear}년 {targetMonth}월 계획으로 복사하기 전에 필요한 항목만 고르세요.
            </p>
          </div>
          <button onClick={onCancel} className="text-xl text-zinc-400 hover:text-zinc-600">×</button>
        </div>

        <div className="border-b border-zinc-100 px-6 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <select
                value={sourceYear}
                onChange={(e) => setSourceYear(parseInt(e.target.value))}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
              <select
                value={sourceMonth}
                onChange={(e) => setSourceMonth(parseInt(e.target.value))}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:border-blue-300 hover:text-blue-600"
              >
                전체 선택
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:border-zinc-300"
              >
                선택 해제
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-zinc-400">불러오는 중...</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-zinc-400">가져올 계획이 없습니다</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const duplicated = existingKeys.has(duplicateKey(item.title, item.goalId));
                return (
                  <div
                    key={item.sourceId}
                    className={`rounded-xl border p-4 ${
                      item.selected ? "border-blue-200 bg-blue-50/40" : "border-zinc-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        disabled={duplicated}
                        onChange={(e) => updateItem(item.sourceId, { selected: e.target.checked })}
                        className="mt-2 rounded"
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.category && (
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{ backgroundColor: item.category.color + "20", color: item.category.color }}
                            >
                              {item.category.icon} {item.category.name}
                            </span>
                          )}
                          {item.goalTitle && <span className="text-xs text-zinc-400">→ 🎯 {item.goalTitle}</span>}
                          {duplicated && <span className="text-xs text-amber-600">이미 현재 월에 있음</span>}
                        </div>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem(item.sourceId, { title: e.target.value })}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => updateItem(item.sourceId, { description: e.target.value })}
                          rows={2}
                          placeholder="설명 없음"
                          className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4">
          <span className="text-sm text-zinc-500">선택 {selectedCount}개</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={saving || selectedCount === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "생성 중..." : `${targetMonth}월 계획으로 생성`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
