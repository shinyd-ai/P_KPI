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
}

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Goal["status"]) => void;
}

const statusLabel: Record<Goal["status"], string> = {
  ACTIVE: "진행 중",
  COMPLETED: "완료",
  DROPPED: "중단",
};

const statusColor: Record<Goal["status"], string> = {
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  DROPPED: "bg-zinc-100 text-zinc-500",
};

export default function GoalCard({ goal, onEdit, onDelete, onStatusChange }: GoalCardProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-400">{goal.year}년</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[goal.status]}`}>
              {statusLabel[goal.status]}
            </span>
          </div>
          <Link
            href={`/goals/${goal.id}`}
            className="text-base font-semibold text-zinc-800 hover:text-blue-600 transition-colors block truncate"
          >
            🎯 {goal.title}
          </Link>
          {goal.description && (
            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{goal.description}</p>
          )}
          <div className="flex gap-4 mt-3 text-xs text-zinc-400">
            <span>월간계획 {goal.monthlyPlans?.length ?? 0}개</span>
            <span>기록 {goal._count?.dailyLogs ?? 0}회</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onEdit(goal)}
            className="text-xs px-3 py-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 rounded transition-colors md:px-2 md:py-1"
          >
            수정
          </button>
          {goal.status === "ACTIVE" ? (
            <button
              onClick={() => onStatusChange(goal.id, "COMPLETED")}
              className="text-xs px-3 py-2 text-blue-600 hover:bg-blue-50 rounded transition-colors md:px-2 md:py-1"
            >
              완료
            </button>
          ) : (
            <button
              onClick={() => onStatusChange(goal.id, "ACTIVE")}
              className="text-xs px-3 py-2 text-green-600 hover:bg-green-50 rounded transition-colors md:px-2 md:py-1"
            >
              재개
            </button>
          )}
          <button
            onClick={() => onDelete(goal.id)}
            className="text-xs px-3 py-2 text-red-500 hover:bg-red-50 rounded transition-colors md:px-2 md:py-1"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}


