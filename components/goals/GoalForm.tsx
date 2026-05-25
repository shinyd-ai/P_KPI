"use client";

import { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface GoalFormProps {
  initialData?: {
    id?: string;
    year?: number;
    title?: string;
    description?: string | null;
    categoryId?: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const inputClass =
  "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 focus:bg-white transition-colors placeholder:text-slate-300";
const labelClass = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide";

export default function GoalForm({ initialData, onSuccess, onCancel }: GoalFormProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(initialData?.year ?? currentYear);
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!initialData?.id;

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setCategories(data);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError("");

    try {
      if (isEdit) {
        const res = await fetch(`/api/goals/${initialData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            categoryId: categoryId || null,
          }),
        });
        if (!res.ok) throw new Error("수정 실패");
      } else {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            title: title.trim(),
            description: description.trim() || null,
            categoryId: categoryId || null,
          }),
        });
        if (!res.ok) throw new Error("생성 실패");
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && (
        <div>
          <label className={labelClass}>연도</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className={inputClass}
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className={labelClass}>카테고리</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputClass}
        >
          <option value="">카테고리 없음</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>목표 제목 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: AI 스킬 마스터리"
          className={inputClass}
          required
        />
      </div>
      <div>
        <label className={labelClass}>설명 (선택)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="목표에 대한 추가 설명..."
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-600 text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-2.5 pt-1">
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-all hover:scale-[1.01]"
          style={{
            background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
            boxShadow: "0 2px 6px rgba(79,124,255,0.3)",
          }}
        >
          {loading ? "저장 중..." : isEdit ? "수정" : "추가"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  );
}
