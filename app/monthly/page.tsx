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

const modalOverlayStyle = {
  background: "rgba(15,23,42,0.5)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
};

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

  const grouped = plans.reduce((acc, plan) => {
    const cat = plan.goal?.category ?? null;
    const key = cat?.id ?? "__none__";
    if (!acc[key]) acc[key] = { category: cat, plans: [] };
    acc[key].plans.push(plan);
    return acc;
  }, {} as Record<string, { category: Category | null; plans: MonthlyPlan[] }>);

  const groups = Object.values(grouped).sort((a, b) => {
    if (!a.category && b.category) return 1;
    if (a.category && !b.category) return -1;
    return (a.category?.name ?? "").localeCompare(b.category?.name ?? "");
  });

  const completionPct = plannedItems.length > 0
    ? Math.round((completedCount / plannedItems.length) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="월간 계획"
        action={{ label: "+ 계획 추가", onClick: () => { setEditPlan(null); setShowForm(true); } }}
      />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {/* Year/Month selector */}
        <div className="flex flex-col gap-3 mb-5 md:flex-row md:items-center">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white w-full md:w-auto"
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
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={
                  month === m
                    ? {
                        background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                        color: "#fff",
                        boxShadow: "0 1px 4px rgba(79,124,255,0.3)",
                      }
                    : {
                        background: "#fff",
                        color: "#64748b",
                        border: "1px solid rgba(0,0,0,0.07)",
                      }
                }
              >
                {m}월
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition-all hover:bg-indigo-100 hover:scale-[1.01] md:ml-auto md:w-auto w-full"
          >
            다른 달에서 가져오기
          </button>
        </div>

        {/* Stats bar */}
        {plans.length > 0 && (
          <div
            className="rounded-2xl p-4 mb-5 flex flex-col gap-3 md:flex-row md:items-center md:gap-5"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-2xl font-black text-indigo-600">{completionPct}%</span>
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  {completedCount}/{plannedItems.length} 완료
                </p>
                {resultOnlyCount > 0 && (
                  <p className="text-xs text-amber-600">실적 기록 {resultOnlyCount}개</p>
                )}
              </div>
            </div>
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${completionPct}%`,
                  background: completionPct === 100
                    ? "linear-gradient(90deg, #10b981, #059669)"
                    : "linear-gradient(90deg, #4f7cff, #6366f1)",
                }}
              />
            </div>
            <div className="flex gap-3 shrink-0 self-end md:self-auto">
              <Link
                href={`/monthly/${year}/${month}`}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                이달의 결과 →
              </Link>
              <Link
                href={`/review/${year}/${month}`}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                AI 회고 →
              </Link>
            </div>
          </div>
        )}

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={modalOverlayStyle}>
            <div
              className="w-full max-w-md max-h-[90vh] overflow-auto mx-4 rounded-2xl p-6 shadow-2xl"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <h3 className="text-base font-bold text-slate-800 mb-4">
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
          <div className="flex items-center justify-center gap-3 text-slate-400 py-20">
            <span className="spinner" />
            <span className="text-sm">불러오는 중...</span>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium mb-1">{year}년 {month}월 계획이 없습니다</p>
            <p className="text-sm text-slate-400 mb-5">이번 달 목표를 세워보세요</p>
            <button
              onClick={() => { setEditPlan(null); setShowForm(true); }}
              className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                boxShadow: "0 2px 8px rgba(79,124,255,0.35)",
              }}
            >
              계획 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl fade-in">
            {groups.map((group) => {
              const cat = group.category;
              const groupPlanned = group.plans.filter((p) => !isResultOnlyPlan(p));
              const groupResultOnlyCount = group.plans.length - groupPlanned.length;
              const groupDone = groupPlanned.filter((p) => p.status === "COMPLETED").length;
              const groupTotal = groupPlanned.length;
              const groupPct = groupTotal > 0 ? Math.round((groupDone / groupTotal) * 100) : 0;
              const catKey = cat?.id ?? "__none__";

              return (
                <div key={catKey}>
                  <button
                    onClick={() => toggleCat(catKey)}
                    className="flex items-center gap-3 w-full mb-2.5 group/cat"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-base">{cat?.icon ?? "📌"}</span>
                      <span className="text-sm font-bold" style={{ color: cat?.color ?? "#6B7280" }}>
                        {cat?.name ?? "미분류"}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {groupDone}/{groupTotal}
                        {groupResultOnlyCount > 0 && ` · 실적 ${groupResultOnlyCount}`}
                      </span>
                    </div>
                    <div className="w-20 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(0,0,0,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${groupPct}%`,
                          backgroundColor: groupPct === 100 ? "#10B981" : (cat?.color ?? "#6B7280"),
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 w-8 text-right shrink-0">{groupPct}%</span>
                    <span
                      className="text-slate-400 transition-transform duration-200 shrink-0"
                      style={{ transform: collapsedCats.has(catKey) ? "rotate(0deg)" : "rotate(90deg)" }}
                    >
                      ›
                    </span>
                  </button>
                  {!collapsedCats.has(catKey) && (
                    <div
                      className="space-y-2 pl-4 border-l-2"
                      style={{ borderColor: cat?.color ? cat.color + "30" : "rgba(0,0,0,0.07)" }}
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
