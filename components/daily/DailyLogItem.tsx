"use client";

interface DailyLog {
  id: string;
  date: string;
  title: string;
  description?: string | null;
  durationMinutes?: number | null;
  alignmentType: "MONTHLY_LINKED" | "GOAL_ALIGNED" | "UNRELATED";
  goal?: { id: string; title: string } | null;
  monthlyPlan?: { id: string; title: string } | null;
}

interface DailyLogItemProps {
  log: DailyLog;
  onDelete: (id: string) => void;
}

const alignmentConfig = {
  MONTHLY_LINKED: { icon: "📌", label: "월간연결", color: "bg-blue-100 text-blue-700" },
  GOAL_ALIGNED: { icon: "🎯", label: "목표연관", color: "bg-amber-100 text-amber-700" },
  UNRELATED: { icon: "⬜", label: "기타", color: "bg-zinc-100 text-zinc-500" },
};

export default function DailyLogItem({ log, onDelete }: DailyLogItemProps) {
  const config = alignmentConfig[log.alignmentType];

  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 flex items-start gap-3 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
            {config.icon} {config.label}
          </span>
          {log.durationMinutes && (
            <span className="text-xs text-zinc-400">⏱ {log.durationMinutes}분</span>
          )}
        </div>
        <p className="text-sm font-medium text-zinc-800">{log.title}</p>
        {log.description && (
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{log.description}</p>
        )}
        <div className="flex gap-3 mt-1.5 text-xs text-zinc-400">
          {log.monthlyPlan && <span>📅 {log.monthlyPlan.title}</span>}
          {log.goal && !log.monthlyPlan && <span>🎯 {log.goal.title}</span>}
        </div>
      </div>
      <button
        onClick={() => onDelete(log.id)}
        className="text-xs text-zinc-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
      >
        ✕
      </button>
    </div>
  );
}


