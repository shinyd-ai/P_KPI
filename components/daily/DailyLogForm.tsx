"use client";

import { useState, useEffect } from "react";

interface Goal {
  id: string;
  title: string;
  description?: string | null;
}

interface MonthlyPlan {
  id: string;
  title: string;
  goal?: { id: string; title: string } | null;
}

type AlignmentType = "MONTHLY_LINKED" | "GOAL_ALIGNED" | "UNRELATED";

interface DailyLogFormProps {
  date: string; // YYYY-MM-DD
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DailyLogForm({ date, onSuccess, onCancel }: DailyLogFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [alignmentType, setAlignmentType] = useState<AlignmentType | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlan[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  useEffect(() => {
    Promise.all([
      fetch(`/api/monthly-plans?year=${year}&month=${month}`).then((r) => r.json()),
      fetch(`/api/goals?year=${year}`).then((r) => r.json()),
    ]).then(([plans, gs]) => {
      setMonthlyPlans(plans.filter((p: { status: string }) => p.status === "ACTIVE"));
      setGoals(gs.filter((g: { status: string }) => g.status === "ACTIVE"));
    });
  }, [year, month]);

  function handleSelectPlan(planId: string) {
    setSelectedPlanId(planId);
    setSelectedGoalId(null);
    setAlignmentType("MONTHLY_LINKED");
    // Auto-set goalId from plan's goal
    const plan = monthlyPlans.find((p) => p.id === planId);
    if (plan?.goal) setSelectedGoalId(plan.goal.id);
  }

  function handleSelectGoal(goalId: string) {
    setSelectedGoalId(goalId);
    setSelectedPlanId(null);
    setAlignmentType("GOAL_ALIGNED");
  }

  function handleSelectUnrelated() {
    setSelectedPlanId(null);
    setSelectedGoalId(null);
    setAlignmentType("UNRELATED");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !alignmentType) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          title: title.trim(),
          description: description.trim() || null,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
          alignmentType,
          monthlyPlanId: selectedPlanId || null,
          goalId: selectedGoalId || null,
        }),
      });
      if (!res.ok) throw new Error("저장 실패");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  const isValid = title.trim() && alignmentType;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">활동 제목 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: Claude API 강의 수강"
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">설명 (선택)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="오늘 한 것, 배운 것..."
          rows={2}
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">소요 시간 (분)</label>
        <input
          type="number"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder="60"
          min={1}
          max={1440}
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-32"
        />
      </div>

      {/* Alignment selector - core UI */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          이 활동을 어떤 목표와 연결할까요? *
        </label>
        <div className="border border-zinc-200 rounded-xl overflow-hidden">
          {/* Monthly plans section */}
          {monthlyPlans.length > 0 && (
            <div className="border-b border-zinc-100">
              <div className="px-4 py-2 bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                📌 이번 달 계획 항목
              </div>
              <div className="divide-y divide-zinc-50">
                {monthlyPlans.map((plan) => (
                  <label
                    key={plan.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      selectedPlanId === plan.id ? "bg-blue-50" : "hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="alignment"
                      checked={selectedPlanId === plan.id}
                      onChange={() => handleSelectPlan(plan.id)}
                      className="text-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-800">{plan.title}</p>
                      {plan.goal && (
                        <p className="text-xs text-zinc-400">→ 🎯 {plan.goal.title}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Goals section */}
          {goals.length > 0 && (
            <div className="border-b border-zinc-100">
              <div className="px-4 py-2 bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                🎯 연간 목표 직접 연결
              </div>
              <div className="divide-y divide-zinc-50">
                {goals.map((goal) => (
                  <label
                    key={goal.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      selectedGoalId === goal.id && alignmentType === "GOAL_ALIGNED"
                        ? "bg-amber-50"
                        : "hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="alignment"
                      checked={selectedGoalId === goal.id && alignmentType === "GOAL_ALIGNED"}
                      onChange={() => handleSelectGoal(goal.id)}
                      className="text-amber-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-800">{goal.title}</p>
                      <p className="text-xs text-zinc-400">월간 계획 없이 직접 연결</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Unrelated */}
          <label
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
              alignmentType === "UNRELATED" ? "bg-zinc-100" : "hover:bg-zinc-50"
            }`}
          >
            <input
              type="radio"
              name="alignment"
              checked={alignmentType === "UNRELATED"}
              onChange={handleSelectUnrelated}
            />
            <div>
              <p className="text-sm text-zinc-600">⬜ 연결 없음 (기타 활동)</p>
              <p className="text-xs text-zinc-400">목표와 무관한 활동</p>
            </div>
          </label>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !isValid}
          className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "저장 중..." : "저장"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-zinc-100 text-zinc-700 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  );
}


