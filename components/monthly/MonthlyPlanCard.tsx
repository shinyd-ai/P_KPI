"use client";

import { useState } from "react";

interface MonthlyPlan {
  id: string;
  year: number;
  month: number;
  title: string;
  description?: string | null;
  status: "ACTIVE" | "COMPLETED" | "PARTIAL" | "MISSED" | "DROPPED";
  resultMemo?: string | null;
  goal?: { id: string; title: string } | null;
  _count?: { dailyLogs: number };
}

interface MonthlyPlanCardProps {
  plan: MonthlyPlan;
  onEdit: (plan: MonthlyPlan) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: MonthlyPlan["status"]) => void;
  onResultSave: (id: string, status: MonthlyPlan["status"], resultMemo: string) => Promise<void>;
}

const statusConfig: Record<MonthlyPlan["status"], { label: string; className: string }> = {
  ACTIVE: { label: "진행 중", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  COMPLETED: { label: "완료", className: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  PARTIAL: { label: "일부 달성", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  MISSED: { label: "미달성", className: "bg-red-50 text-red-600 border border-red-200" },
  DROPPED: { label: "중단", className: "bg-slate-100 text-slate-500 border border-slate-200" },
};

const resultStatuses: MonthlyPlan["status"][] = ["COMPLETED", "PARTIAL", "MISSED", "DROPPED"];
const RESULT_ONLY_PREFIX = "[실적] ";

export default function MonthlyPlanCard({
  plan,
  onEdit,
  onDelete,
  onStatusChange,
  onResultSave,
}: MonthlyPlanCardProps) {
  const [showResultEditor, setShowResultEditor] = useState(false);
  const [draftStatus, setDraftStatus] = useState<MonthlyPlan["status"]>(plan.status);
  const [draftMemo, setDraftMemo] = useState(plan.resultMemo ?? "");
  const [saving, setSaving] = useState(false);
  const isResultOnly = plan.title.startsWith(RESULT_ONLY_PREFIX);
  const displayTitle = isResultOnly
    ? plan.title.slice(RESULT_ONLY_PREFIX.length) || plan.goal?.title || "실적 기록"
    : plan.title;

  async function handleSaveResult() {
    setSaving(true);
    try {
      await onResultSave(plan.id, draftStatus, draftMemo);
      setShowResultEditor(false);
    } finally {
      setSaving(false);
    }
  }

  const config = statusConfig[plan.status];

  return (
    <div
      className="rounded-xl p-4 transition-all duration-200 hover:shadow-md group"
      style={
        isResultOnly
          ? { background: "#fffbeb", border: "1px solid #fde68a", boxShadow: "0 1px 3px rgba(245,158,11,0.08)" }
          : plan.status === "COMPLETED"
          ? { background: "#f5f7ff", border: "1px solid #c7d2fe", boxShadow: "0 1px 3px rgba(99,102,241,0.08)" }
          : { background: "var(--card-bg)", border: "1px solid var(--card-border)", boxShadow: "var(--card-shadow)" }
      }
    >
      <div className="flex items-start gap-3">
        {!isResultOnly && (
          <button
            onClick={() => onStatusChange(plan.id, plan.status === "COMPLETED" ? "ACTIVE" : "COMPLETED")}
            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
              plan.status === "COMPLETED"
                ? "border-indigo-500 bg-indigo-500"
                : "border-slate-300 hover:border-indigo-400"
            }`}
          >
            {plan.status === "COMPLETED" && (
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                <polyline points="2 6 5 9 10 3" />
              </svg>
            )}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 min-w-0">
            {isResultOnly ? (
              <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 border border-amber-200">
                실적 기록
              </span>
            ) : (
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${config.className}`}>
                {config.label}
              </span>
            )}
            {plan.goal && (
              <span className="text-xs text-slate-400 truncate min-w-0">→ {plan.goal.title}</span>
            )}
          </div>
          <p className={`text-sm font-medium leading-snug ${
            plan.status === "COMPLETED" ? "line-through text-slate-400" : "text-slate-800"
          }`}>
            {displayTitle}
          </p>
          {plan.description && !isResultOnly && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 leading-relaxed">{plan.description}</p>
          )}
          {plan.resultMemo && (
            <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 line-clamp-2">
              {plan.resultMemo}
            </div>
          )}
          {/* 진행률 바 */}
          {(plan.status === "COMPLETED" || plan.status === "PARTIAL" || plan.status === "MISSED") && (
            <div className="mt-3">
              <div className="h-0.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={
                    plan.status === "COMPLETED"
                      ? { width: "100%", background: "linear-gradient(90deg, #4f7cff, #6366f1)" }
                      : plan.status === "PARTIAL"
                      ? { width: "50%", background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }
                      : { width: "0%", background: "#cbd5e1" }
                  }
                />
              </div>
            </div>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">기록 {plan._count?.dailyLogs ?? 0}회</span>
            <button
              type="button"
              onClick={() => {
                setDraftStatus(plan.status === "ACTIVE" ? "COMPLETED" : plan.status);
                setDraftMemo(plan.resultMemo ?? "");
                setShowResultEditor((value) => !value);
              }}
              className="shrink-0 text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              {isResultOnly ? "실적 수정" : "실적 입력"}
            </button>
          </div>
          {showResultEditor && (
            <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {!isResultOnly && (
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {resultStatuses.map((status) => {
                    const sc = statusConfig[status];
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setDraftStatus(status)}
                        className={`rounded-lg px-2 py-2 text-xs font-medium transition-all ${
                          draftStatus === status ? sc.className : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              )}
              <textarea
                value={draftMemo}
                onChange={(e) => setDraftMemo(e.target.value)}
                rows={3}
                placeholder="이번 달 실제 결과를 짧게 남기기"
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-300"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResultEditor(false)}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveResult}
                  disabled={saving}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                    boxShadow: "0 1px 4px rgba(79,124,255,0.3)",
                  }}
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Desktop: visible on hover only */}
        <div className="hidden md:flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(plan)}
            className="text-xs px-2.5 py-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            수정
          </button>
          <button
            onClick={() => onDelete(plan.id)}
            className="text-xs px-2.5 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            삭제
          </button>
        </div>
        {/* Mobile: always visible */}
        <div className="flex md:hidden flex-col gap-0.5 shrink-0">
          <button
            onClick={() => onEdit(plan)}
            className="text-xs px-2.5 py-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            수정
          </button>
          <button
            onClick={() => onDelete(plan.id)}
            className="text-xs px-2.5 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
