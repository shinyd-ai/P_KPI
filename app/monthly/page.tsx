"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import MonthlyPlanCard from "@/components/monthly/MonthlyPlanCard";
import MonthlyPlanForm from "@/components/monthly/MonthlyPlanForm";
import MonthlyPlanImportModal from "@/components/monthly/MonthlyPlanImportModal";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface MonthlyPlan {
  id: string;
  year: number;
  month: number;
  title: string;
  description?: string | null;
  status: "ACTIVE" | "COMPLETED" | "PARTIAL" | "MISSED" | "DROPPED";
  resultMemo?: string | null;
  goal?: { id: string; title: string; category?: Category | null } | null;
  _count?: { dailyLogs: number };
}

function isResultOnlyPlan(plan: MonthlyPlan) {
  return plan.title.startsWith("[실적] ");
}

export default function MonthlyPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [plans, setPlans] = useState<MonthlyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editPlan, setEditPlan] = useState<MonthlyPlan | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/monthly-plans?year=${year}&month=${month}`);
      setPlans(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    let ignore = false;

    async function loadPlans() {
      try {
        const res = await fetch(`/api/monthly-plans?year=${year}&month=${month}`);
        const data = await res.json();
        if (!ignore) setPlans(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadPlans();
    return () => { ignore = true; };
  }, [year, month]);

  async function handleDelete(id: string) {
    if (!confirm("이 계획을 삭제할까요?")) return;
    await fetch(`/api/monthly-plans?id=${id}`, { method: "DELETE" });
    fetchPlans();
  }

  async function handleStatusChange(id: string, status: MonthlyPlan["status"]) {
    await fetch("/api/monthly-plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchPlans();
  }

  async function handleResultSave(id: string, status: MonthlyPlan["status"], resultMemo: string) {
    await fetch("/api/monthly-plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, resultMemo: resultMemo.trim() || null }),
    });
    fetchPlans();
  }

  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

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

  const currentYear = now.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const plannedItems = plans.filter((p) => !isResultOnlyPlan(p));
  const resultOnlyCount = plans.length - plannedItems.length;
  const completedCount = plannedItems.filter((p) => p.status === "COMPLETED").length;

  // 카테고리별로 그룹핑 (goal → category 경유)
  const grouped = plans.reduce((acc, plan) => {
    const cat = plan.goal?.category ?? null;
    const key = cat?.id ?? "__none__";
    if (!acc[key]) acc[key] = { category: cat, plans: [] };
    acc[key].plans.push(plan);
    return acc;
  }, {} as Record<string, { category: Category | null; plans: MonthlyPlan[] }>);

  // 카테고리 이름 가나다순 정렬, 미분류는 맨 뒤
  const groups = Object.values(grouped).sort((a, b) => {
    if (!a.category && b.category) return 1;
    if (a.category && !b.category) return -1;
    return (a.category?.name ?? "").localeCompare(b.category?.name ?? "");
  });

  return (
    <div className="flex flex-col h-full">
      <Header
        title="월간 계획"
        action={{ label: "+ 계획 추가", onClick: () => { setEditPlan(null); setShowForm(true); } }}
      />
      <div className="flex-1 p-6 overflow-auto">
        {/* Year/Month selector */}
        <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <div className="flex gap-1 flex-wrap">
            {months.map((m) => (
              <button
                key={m}
                onClick={() => setMonth(m)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors md:py-1 ${
                  month === m ? "bg-blue-600 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-blue-300"
                }`}
              >
                {m}월
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 md:ml-auto md:w-auto"
          >
            다른 달에서 가져오기
          </button>
        </div>

        {/* Stats bar */}
        {plans.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-5 flex flex-col gap-3 text-sm md:flex-row md:items-center md:gap-6">
            <span className="text-zinc-500">
              <span className="font-semibold text-zinc-800">{completedCount}/{plannedItems.length}</span> 완료
              {resultOnlyCount > 0 && (
                <span className="ml-2 text-amber-600">실적 기록 {resultOnlyCount}개</span>
              )}
            </span>
            <div className="flex-1 bg-zinc-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${plannedItems.length ? (completedCount / plannedItems.length) * 100 : 0}%` }}
              />
            </div>
            <Link
              href={`/monthly/${year}/${month}`}
              className="text-sm text-blue-600 hover:underline shrink-0 self-end md:self-auto"
            >
              📊 이달의 결과 →
            </Link>
            <Link
              href={`/review/${year}/${month}`}
              className="text-sm text-zinc-500 hover:underline shrink-0 self-end md:self-auto"
            >
              📋 AI 회고 →
            </Link>
          </div>
        )}

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-auto mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-zinc-800 mb-4">
                {editPlan ? "계획 수정" : `${year}년 ${month}월 계획 추가`}
              </h3>
              <MonthlyPlanForm
                initialData={editPlan ?? undefined}
                year={year}
                month={month}
                onSuccess={() => { setShowForm(false); setEditPlan(null); fetchPlans(); }}
                onCancel={() => { setShowForm(false); setEditPlan(null); }}
              />
            </div>
          </div>
        )}

        {showImportModal && (
          <MonthlyPlanImportModal
            targetYear={year}
            targetMonth={month}
            existingPlans={plans}
            onSuccess={() => { setShowImportModal(false); fetchPlans(); }}
            onCancel={() => setShowImportModal(false)}
          />
        )}

        {/* Plans list */}
        {loading ? (
          <div className="text-center text-zinc-400 py-20">불러오는 중...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 mb-4">{year}년 {month}월 계획이 없습니다</p>
            <button
              onClick={() => { setEditPlan(null); setShowForm(true); }}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              계획 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl">
            {groups.map((group) => {
              const cat = group.category;
              const groupPlanned = group.plans.filter((p) => !isResultOnlyPlan(p));
              const groupResultOnlyCount = group.plans.length - groupPlanned.length;
              const groupDone = groupPlanned.filter((p) => p.status === "COMPLETED").length;
              const groupTotal = groupPlanned.length;
              const groupPct = groupTotal > 0 ? Math.round((groupDone / groupTotal) * 100) : 0;
              return (
                <div key={cat?.id ?? "__none__"}>
                  {/* 카테고리 섹션 헤더 */}
                  <button
                    onClick={() => toggleCat(cat?.id ?? "__none__")}
                    className="flex items-center gap-3 w-full mb-2 group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">{cat?.icon ?? "📌"}</span>
                      <span className="text-sm font-bold" style={{ color: cat?.color ?? "#6B7280" }}>
                        {cat?.name ?? "미분류"}
                      </span>
                      <span className="text-xs text-zinc-400 shrink-0">
                        {groupDone}/{groupTotal}
                        {groupResultOnlyCount > 0 && ` · 실적 ${groupResultOnlyCount}`}
                      </span>
                    </div>
                    <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden shrink-0">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${groupPct}%`,
                          backgroundColor: groupPct === 100 ? "#10B981" : (cat?.color ?? "#6B7280"),
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-zinc-500 w-8 text-right shrink-0">{groupPct}%</span>
                    <span
                      className="text-zinc-400 transition-transform duration-200 shrink-0"
                      style={{ transform: collapsedCats.has(cat?.id ?? "__none__") ? "rotate(0deg)" : "rotate(90deg)" }}
                    >
                      ›
                    </span>
                  </button>
                  {/* 해당 카테고리의 계획 목록 */}
                  {!collapsedCats.has(cat?.id ?? "__none__") && (
                    <div
                      className="space-y-2 pl-5 border-l-2"
                      style={{ borderColor: cat?.color ? cat.color + "40" : "#E4E4E7" }}
                    >
                      {group.plans.map((plan) => (
                        <MonthlyPlanCard
                          key={plan.id}
                          plan={plan}
                          onEdit={(p) => { setEditPlan(p); setShowForm(true); }}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                          onResultSave={handleResultSave}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


