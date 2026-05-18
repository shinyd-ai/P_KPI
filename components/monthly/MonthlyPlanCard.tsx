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

const statusColor: Record<MonthlyPlan["status"], string> = {
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  MISSED: "bg-red-100 text-red-700",
  DROPPED: "bg-zinc-100 text-zinc-500",
};

const statusLabel: Record<MonthlyPlan["status"], string> = {
  ACTIVE: "진행 중",
  COMPLETED: "완료",
  PARTIAL: "일부 달성",
  MISSED: "미달성",
  DROPPED: "중단",
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

  return (
    <div className={`bg-white border rounded-xl p-4 transition-shadow hover:shadow-sm ${
      isResultOnly
        ? "border-amber-200 bg-amber-50/30"
        : plan.status === "COMPLETED"
        ? "border-blue-200 bg-blue-50/30"
        : "border-zinc-200"
    }`}>
      <div className="flex items-start gap-3">
        {!isResultOnly && (
          <button
            onClick={() => onStatusChange(plan.id, plan.status === "COMPLETED" ? "ACTIVE" : "COMPLETED")}
            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              plan.status === "COMPLETED"
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-zinc-300 hover:border-blue-400"
            }`}
          >
            {plan.status === "COMPLETED" && <span className="text-xs">✓</span>}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {isResultOnly ? (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                실적 기록
              </span>
            ) : (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor[plan.status]}`}>
                {statusLabel[plan.status]}
              </span>
            )}
            {plan.goal && (
              <span className="text-xs text-zinc-400">→ 🎯 {plan.goal.title}</span>
            )}
          </div>
          <p className={`text-sm font-medium ${plan.status === "COMPLETED" ? "line-through text-zinc-400" : "text-zinc-800"}`}>
            {displayTitle}
          </p>
          {plan.description && !isResultOnly && (
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{plan.description}</p>
          )}
          {plan.resultMemo && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 mt-2 line-clamp-2">
              실적: {plan.resultMemo}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-xs text-zinc-400">기록 {plan._count?.dailyLogs ?? 0}회</p>
            <button
              type="button"
              onClick={() => {
                setDraftStatus(plan.status === "ACTIVE" ? "COMPLETED" : plan.status);
                setDraftMemo(plan.resultMemo ?? "");
                setShowResultEditor((value) => !value);
              }}
              className="text-xs px-2 py-1 rounded border border-zinc-200 text-zinc-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {isResultOnly ? "실적 수정" : "실적 입력"}
            </button>
          </div>
          {showResultEditor && (
            <div className="mt-3 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              {!isResultOnly && (
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                  {resultStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDraftStatus(status)}
                      className={`rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                        draftStatus === status
                          ? statusColor[status]
                          : "bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      {statusLabel[status]}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={draftMemo}
                onChange={(e) => setDraftMemo(e.target.value)}
                rows={3}
                placeholder="이번 달 실제 결과를 짧게 남기기"
                className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResultEditor(false)}
                  className="rounded-md px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-100"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveResult}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(plan)}
            className="text-xs px-3 py-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded transition-colors md:px-2 md:py-1"
          >
            수정
          </button>
          <button
            onClick={() => onDelete(plan.id)}
            className="text-xs px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors md:px-2 md:py-1"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}


