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
}

const PRESET_EMOJIS = ["🏢", "📚", "📈", "🔗", "🤝", "📖", "🤖", "🏬", "💪", "👨‍👩‍👧", "🎯", "💡", "🌱", "✈️", "💰"];
const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6B7280",
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // 카테고리 관리 모달 상태
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

  // 카테고리 저장 (추가 or 수정)
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

  // 목표를 카테고리별로 그룹핑
  const grouped = goals.reduce((acc, goal) => {
    const key = goal.category?.id ?? "__none__";
    if (!acc[key]) acc[key] = { category: goal.category ?? null, goals: [] };
    acc[key].goals.push(goal);
    return acc;
  }, {} as Record<string, { category: Goal["category"]; goals: Goal[] }>);

  // 카테고리 순서(order)로 정렬, 미분류는 맨 뒤
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
      <div className="flex-1 p-6 overflow-auto">
        {/* 상단 컨트롤 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setFilterYear(y)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterYear === y
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-blue-300"
                }`}
              >
                {y}년
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCatManager(true)}
            className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors"
          >
            ⚙️ 카테고리 관리
          </button>
        </div>

        {/* 목표 추가/수정 모달 */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-zinc-800 mb-4">
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
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                <h3 className="text-lg font-semibold text-zinc-800">카테고리 관리</h3>
                <button onClick={() => { setShowCatManager(false); cancelCatEdit(); }} className="text-zinc-400 hover:text-zinc-600 text-xl">✕</button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* 기존 카테고리 목록 */}
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${editCat?.id === cat.id ? "border-blue-300 bg-blue-50" : "border-zinc-100 bg-zinc-50"}`}>
                      <span className="text-xl w-8 text-center">{cat.icon}</span>
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="flex-1 text-sm font-medium text-zinc-700">{cat.name}</span>
                      <span className="text-xs text-zinc-400">{cat._count?.goals ?? 0}개</span>
                      <button onClick={() => startEditCat(cat)} className="text-xs text-zinc-400 hover:text-blue-600 px-2 py-1 rounded transition-colors">수정</button>
                      <button onClick={() => handleDeleteCat(cat.id)} className="text-xs text-zinc-400 hover:text-red-500 px-2 py-1 rounded transition-colors">삭제</button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-sm text-zinc-400 text-center py-4">카테고리가 없습니다</p>
                  )}
                </div>

                {/* 추가/수정 폼 */}
                <div className="border-t border-zinc-100 pt-4">
                  <p className="text-sm font-medium text-zinc-600 mb-3">{editCat ? "카테고리 수정" : "새 카테고리 추가"}</p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="카테고리 이름 (예: 부동산)"
                      className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {/* 이모지 선택 */}
                    <div>
                      <p className="text-xs text-zinc-500 mb-1.5">아이콘</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setCatIcon(emoji)}
                            className={`w-9 h-9 text-lg rounded-lg border-2 transition-colors ${catIcon === emoji ? "border-blue-500 bg-blue-50" : "border-zinc-100 hover:border-zinc-300"}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* 색상 선택 */}
                    <div>
                      <p className="text-xs text-zinc-500 mb-1.5">색상</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setCatColor(color)}
                            className={`w-7 h-7 rounded-full border-2 transition-all ${catColor === color ? "border-zinc-800 scale-110" : "border-transparent hover:scale-105"}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveCat}
                        disabled={catSaving || !catName.trim()}
                        className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {catSaving ? "저장 중..." : editCat ? "수정" : "추가"}
                      </button>
                      {editCat && (
                        <button
                          onClick={cancelCatEdit}
                          className="px-4 py-2 bg-zinc-100 text-zinc-600 text-sm rounded-lg hover:bg-zinc-200 transition-colors"
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

        {/* 목표 목록 (카테고리별 그룹) */}
        {loading ? (
          <div className="text-center text-zinc-400 py-20">불러오는 중...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 mb-4">아직 목표가 없습니다</p>
            <button
              onClick={() => { setEditGoal(null); setShowForm(true); }}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              첫 목표 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-8 max-w-2xl">
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
                    className="flex items-center gap-3 w-full mb-3 group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">{cat?.icon ?? "📌"}</span>
                      <span className="text-sm font-bold" style={{ color: cat?.color ?? "#6B7280" }}>
                        {cat?.name ?? "미분류"}
                      </span>
                      <span className="text-xs text-zinc-400">{done}/{total}</span>
                    </div>
                    <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden shrink-0">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct === 100 ? "#10B981" : (cat?.color ?? "#6B7280"),
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-zinc-500 w-8 text-right shrink-0">{pct}%</span>
                    <span
                      className="text-zinc-400 transition-transform duration-200 shrink-0"
                      style={{ transform: collapsedCats.has(key) ? "rotate(0deg)" : "rotate(90deg)" }}
                    >
                      ›
                    </span>
                  </button>

                  {/* 해당 카테고리의 목표 목록 */}
                  {!collapsedCats.has(key) && (
                    <div className="space-y-3 pl-5 border-l-2" style={{ borderColor: cat?.color ? cat.color + "40" : "#E4E4E7" }}>
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


