"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import GoalCard from "@/components/goals/GoalCard";
import GoalForm from "@/components/goals/GoalForm";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  _count?: { goals: number };
}

interface Goal {
  id: string;
  year: number;
  title: string;
  description?: string | null;
  status: "ACTIVE" | "COMPLETED" | "DROPPED";
  categoryId?: string | null;
  category?: { id: string; name: string; icon: string; color: string } | null;
  _count?: { dailyLogs: number };
  monthlyPlans?: { id: string }[];
  progressRate?: number;
}

const PRESET_EMOJIS = ["🏢", "📚", "📈", "🔗", "🤝", "📖", "🤖", "🏬", "💪", "👨‍👩‍👧", "🎯", "💡", "🌱", "✈️", "💰"];
const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6B7280",
];

const modalOverlayStyle = {
  background: "rgba(15,23,42,0.5)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const [showCatManager, setShowCatManager] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("📌");
  const [catColor, setCatColor] = useState("#6B7280");
  const [catSaving, setCatSaving] = useState(false);

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

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/goals?year=${filterYear}`);
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterYear]);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadGoals() {
      try {
        const res = await fetch(`/api/goals?year=${filterYear}`);
        const data = await res.json();
        if (!ignore) setGoals(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadGoals();
    return () => { ignore = true; };
  }, [filterYear]);

  useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (!ignore) setCategories(Array.isArray(data) ? data : []);
    }

    loadCategories();
    return () => { ignore = true; };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("이 목표를 삭제할까요? 관련 기록은 유지됩니다.")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    fetchGoals();
  }

  async function handleStatusChange(id: string, status: Goal["status"]) {
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchGoals();
  }

  async function handleSaveCat() {
    if (!catName.trim()) return;
    setCatSaving(true);
    try {
      if (editCat) {
        await fetch("/api/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editCat.id, name: catName.trim(), icon: catIcon, color: catColor }),
        });
      } else {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: catName.trim(), icon: catIcon, color: catColor }),
        });
      }
      await fetchCategories();
      setEditCat(null);
      setCatName("");
      setCatIcon("📌");
      setCatColor("#6B7280");
    } finally {
      setCatSaving(false);
    }
  }

  async function handleDeleteCat(id: string) {
    if (!confirm("카테고리를 삭제하면 해당 카테고리의 목표들이 미분류로 변경됩니다. 계속할까요?")) return;
    await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    await Promise.all([fetchCategories(), fetchGoals()]);
  }

  function startEditCat(cat: Category) {
    setEditCat(cat);
    setCatName(cat.name);
    setCatIcon(cat.icon);
    setCatColor(cat.color);
  }

  function cancelCatEdit() {
    setEditCat(null);
    setCatName("");
    setCatIcon("📌");
    setCatColor("#6B7280");
  }

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const grouped = goals.reduce((acc, goal) => {
    const key = goal.category?.id ?? "__none__";
    if (!acc[key]) acc[key] = { category: goal.category ?? null, goals: [] };
    acc[key].goals.push(goal);
    return acc;
  }, {} as Record<string, { category: Goal["category"]; goals: Goal[] }>);

  const sortedCategoryIds = [
    ...categories.map((c) => c.id).filter((id) => grouped[id]),
    ...(grouped["__none__"] ? ["__none__"] : []),
  ];

  return (
    <div className="flex flex-col h-full">
      <Header
        title="연간 목표"
        action={{ label: "+ 목표 추가", onClick: () => { setEditGoal(null); setShowForm(true); } }}
      />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {/* 상단 컨트롤 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1.5">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setFilterYear(y)}
                className="px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={
                  filterYear === y
                    ? {
                        background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                        color: "#fff",
                        boxShadow: "0 2px 6px rgba(79,124,255,0.3)",
                      }
                    : {
                        background: "#fff",
                        color: "#64748b",
                        border: "1px solid rgba(0,0,0,0.07)",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      }
                }
              >
                {y}년
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCatManager(true)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-white transition-all bg-white/60"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
            </svg>
            카테고리 관리
          </button>
        </div>

        {/* 목표 추가/수정 모달 */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={modalOverlayStyle}>
            <div
              className="w-full max-w-md mx-4 rounded-2xl p-6 shadow-2xl"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <h3 className="text-base font-bold text-slate-800 mb-4">
                {editGoal ? "목표 수정" : "새 목표 추가"}
              </h3>
              <GoalForm
                initialData={editGoal ?? { year: filterYear }}
                onSuccess={() => { setShowForm(false); setEditGoal(null); fetchGoals(); }}
                onCancel={() => { setShowForm(false); setEditGoal(null); }}
              />
            </div>
          </div>
        )}

        {/* 카테고리 관리 모달 */}
        {showCatManager && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={modalOverlayStyle}>
            <div
              className="w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <h3 className="text-base font-bold text-slate-800">카테고리 관리</h3>
                <button
                  onClick={() => { setShowCatManager(false); cancelCatEdit(); }}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* 기존 카테고리 목록 */}
                <div className="space-y-1.5">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        editCat?.id === cat.id
                          ? "border-indigo-200 bg-indigo-50"
                          : "border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200"
                      }`}
                    >
                      <span className="text-lg w-8 text-center">{cat.icon}</span>
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="flex-1 text-sm font-medium text-slate-700">{cat.name}</span>
                      <span className="text-xs text-slate-400">{cat._count?.goals ?? 0}개</span>
                      <button
                        onClick={() => startEditCat(cat)}
                        className="text-xs text-slate-400 hover:text-indigo-600 px-2 py-1 rounded-lg transition-colors hover:bg-indigo-50"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteCat(cat.id)}
                        className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg transition-colors hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">카테고리가 없습니다</p>
                  )}
                </div>

                {/* 추가/수정 폼 */}
                <div className="pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
                    {editCat ? "카테고리 수정" : "새 카테고리 추가"}
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="카테고리 이름 (예: 부동산)"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 focus:bg-white transition-colors"
                    />
                    <div>
                      <p className="text-xs text-slate-400 mb-1.5 font-medium">아이콘</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setCatIcon(emoji)}
                            className={`w-9 h-9 text-lg rounded-xl border-2 transition-all ${
                              catIcon === emoji
                                ? "border-indigo-400 bg-indigo-50 scale-110"
                                : "border-slate-100 hover:border-slate-200 hover:scale-105"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1.5 font-medium">색상</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setCatColor(color)}
                            className={`w-7 h-7 rounded-full border-2 transition-all ${
                              catColor === color ? "border-slate-800 scale-110" : "border-transparent hover:scale-105"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveCat}
                        disabled={catSaving || !catName.trim()}
                        className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-all hover:scale-[1.01]"
                        style={{
                          background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                          boxShadow: "0 2px 6px rgba(79,124,255,0.3)",
                        }}
                      >
                        {catSaving ? "저장 중..." : editCat ? "수정" : "추가"}
                      </button>
                      {editCat && (
                        <button
                          onClick={cancelCatEdit}
                          className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
                        >
                          취소
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 목표 목록 */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 text-slate-400 py-20">
            <span className="spinner" />
            <span className="text-sm">불러오는 중...</span>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium mb-1">아직 목표가 없습니다</p>
            <p className="text-sm text-slate-400 mb-5">첫 번째 연간 목표를 추가해 보세요</p>
            <button
              onClick={() => { setEditGoal(null); setShowForm(true); }}
              className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                boxShadow: "0 2px 8px rgba(79,124,255,0.35)",
              }}
            >
              첫 목표 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-7 max-w-2xl fade-in">
            {sortedCategoryIds.map((key) => {
              const group = grouped[key];
              if (!group) return null;
              const cat = group.category;
              const done = group.goals.filter((g) => g.status === "COMPLETED").length;
              const total = group.goals.length;
              const pct = Math.round((done / total) * 100);

              return (
                <div key={key}>
                  {/* 카테고리 섹션 헤더 */}
                  <button
                    onClick={() => toggleCat(key)}
                    className="flex items-center gap-3 w-full mb-3 group/cat"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-base">{cat?.icon ?? "📌"}</span>
                      <span className="text-sm font-bold" style={{ color: cat?.color ?? "#6B7280" }}>
                        {cat?.name ?? "미분류"}
                      </span>
                      <span className="text-xs text-slate-400">{done}/{total}</span>
                    </div>
                    <div className="w-20 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(0,0,0,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct === 100 ? "#10B981" : (cat?.color ?? "#6B7280"),
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 w-8 text-right shrink-0">{pct}%</span>
                    <span
                      className="text-slate-400 transition-transform duration-200 shrink-0"
                      style={{ transform: collapsedCats.has(key) ? "rotate(0deg)" : "rotate(90deg)" }}
                    >
                      ›
                    </span>
                  </button>

                  {/* 카테고리별 목표 목록 */}
                  {!collapsedCats.has(key) && (
                    <div
                      className="space-y-2.5 pl-4 border-l-2"
                      style={{ borderColor: cat?.color ? cat.color + "30" : "rgba(0,0,0,0.08)" }}
                    >
                      {group.goals.map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          onEdit={(g) => { setEditGoal(g); setShowForm(true); }}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
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
