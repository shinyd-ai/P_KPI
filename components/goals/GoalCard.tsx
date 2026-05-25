"use client";

import Link from "next/link";

interface Goal {
  id: string;
  year: number;
  title: string;
  description?: string | null;
  status: "ACTIVE" | "COMPLETED" | "DROPPED";
  _count?: { dailyLogs: number };
  monthlyPlans?: { id: string }[];
  progressRate?: number;
}

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Goal["status"]) => void;
}

const statusConfig: Record<Goal["status"], { label: string; className: string }> = {
  ACTIVE: { label: "진행 중", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  COMPLETED: { label: "완료", className: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  DROPPED: { label: "중단", className: "bg-slate-100 text-slate-500 border border-slate-200" },
};

export default function GoalCard({ goal, onEdit, onDelete, onStatusChange }: GoalCardProps) {
  const config = statusConfig[goal.status];

  return (
    <div
      className="rounded-xl p-4 transition-all duration-200 hover:shadow-md group"
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.className}`}>
              {config.label}
            </span>
          </div>
          <Link
            href={`/goals/${goal.id}`}
            className="text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors block truncate"
          >
            {goal.title}
          </Link>
          {goal.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{goal.description}</p>
          )}
          <div className="flex gap-3 mt-2.5 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              월간계획 {goal.monthlyPlans?.length ?? 0}개
            </span>
            <span className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              기록 {goal._count?.dailyLogs ?? 0}회
            </span>
          </div>
          {/* 진행률 바 */}
          {(goal.progressRate ?? 0) > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-400 mb-1">진행률 {goal.progressRate}%</p>
              <div className="h-0.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${goal.progressRate}%`,
                    background: goal.progressRate === 100
                      ? "linear-gradient(90deg, #10b981, #059669)"
                      : "linear-gradient(90deg, #4f7cff, #6366f1)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
        {/* Desktop: visible on hover only */}
        <div className="hidden md:flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(goal)}
            className="text-xs px-2.5 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            수정
          </button>
          {goal.status === "ACTIVE" ? (
            <button
              onClick={() => onStatusChange(goal.id, "COMPLETED")}
              className="text-xs px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              완료
            </button>
          ) : (
            <button
              onClick={() => onStatusChange(goal.id, "ACTIVE")}
              className="text-xs px-2.5 py-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              재개
            </button>
          )}
          <button
            onClick={() => onDelete(goal.id)}
            className="text-xs px-2.5 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            삭제
          </button>
        </div>
        {/* Mobile: always visible actions */}
        <div className="flex md:hidden flex-col gap-0.5 shrink-0">
          <button
            onClick={() => onEdit(goal)}
            className="text-xs px-2.5 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            수정
          </button>
          {goal.status === "ACTIVE" ? (
            <button
              onClick={() => onStatusChange(goal.id, "COMPLETED")}
              className="text-xs px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              완료
            </button>
          ) : (
            <button
              onClick={() => onStatusChange(goal.id, "ACTIVE")}
              className="text-xs px-2.5 py-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              재개
            </button>
          )}
          <button
            onClick={() => onDelete(goal.id)}
            className="text-xs px-2.5 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
