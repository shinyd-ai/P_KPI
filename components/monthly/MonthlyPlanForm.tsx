"use client";

import { useState, useEffect } from "react";

interface Goal {
  id: string;
  title: string;
}

interface MonthlyPlanFormProps {
  initialData?: {
    id?: string;
    title?: string;
    description?: string | null;
    status?: "ACTIVE" | "COMPLETED" | "PARTIAL" | "MISSED" | "DROPPED";
    resultMemo?: string | null;
    goalId?: string | null;
  };
  year: number;
  month: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MonthlyPlanForm({
  initialData,
  year,
  month,
  onSuccess,
  onCancel,
}: MonthlyPlanFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "ACTIVE");
  const [resultMemo, setResultMemo] = useState(initialData?.resultMemo ?? "");
  const [goalId, setGoalId] = useState(initialData?.goalId ?? "");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!initialData?.id;

  useEffect(() => {
    fetch(`/api/goals?year=${year}`)
      .then((r) => r.json())
      .then((data) => setGoals(data.filter((g: { status: string }) => g.status === "ACTIVE")));
  }, [year]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError("");

    try {
      if (isEdit) {
        const res = await fetch("/api/monthly-plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: initialData.id,
            title: title.trim(),
            description: description.trim() || null,
            status,
            resultMemo: resultMemo.trim() || null,
            goalId: goalId || null,
          }),
        });
        if (!res.ok) throw new Error("수정 실패");
      } else {
        const res = await fetch("/api/monthly-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            month,
            title: title.trim(),
            description: description.trim() || null,
            status,
            resultMemo: resultMemo.trim() || null,
            goalId: goalId || null,
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
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">계획 제목 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: AI 강의 수강 완료"
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">설명 (선택)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="이번 달 계획 세부 내용..."
          rows={2}
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">연관 연간 목표</label>
        <select
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">연결 없음</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>🎯 {g.title}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">결과 상태</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ACTIVE">진행 중</option>
          <option value="COMPLETED">완료</option>
          <option value="PARTIAL">일부 달성</option>
          <option value="MISSED">미달성</option>
          <option value="DROPPED">중단</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">실적 메모</label>
        <textarea
          value={resultMemo}
          onChange={(e) => setResultMemo(e.target.value)}
          placeholder="이번 달 실제 결과나 다음 달에 반영할 점..."
          rows={3}
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "저장 중..." : isEdit ? "수정" : "추가"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-zinc-100 text-zinc-700 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  );
}


