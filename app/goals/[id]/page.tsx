"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";

interface Goal {
  id: string;
  year: number;
  title: string;
  description?: string | null;
  status: "ACTIVE" | "COMPLETED" | "DROPPED";
  monthlyPlans: Array<{
    id: string;
    year: number;
    month: number;
    title: string;
    status: string;
  }>;
  dailyLogs: Array<{
    id: string;
    date: string;
    title: string;
    alignmentType: string;
    durationMinutes?: number | null;
  }>;
}

const alignmentConfig: Record<string, { label: string; className: string }> = {
  MONTHLY_LINKED: { label: "월간연결", className: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  GOAL_ALIGNED: { label: "목표연관", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  UNRELATED: { label: "기타", className: "bg-slate-100 text-slate-500 border border-slate-200" },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "진행 중", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  COMPLETED: { label: "완료", className: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  DROPPED: { label: "중단", className: "bg-slate-100 text-slate-500 border border-slate-200" },
};

const cardStyle = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  boxShadow: "var(--card-shadow)",
};

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadGoal() {
      try {
        const res = await fetch(`/api/goals/${id}`);
        if (!res.ok) {
          router.push("/goals");
          return;
        }
        const data = await res.json();
        if (!ignore) setGoal(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadGoal();
    return () => { ignore = true; };
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center gap-3 text-slate-400">
        <span className="spinner" />
        <span className="text-sm">불러오는 중...</span>
      </div>
    );
  }

  if (!goal) return null;

  const totalMinutes = goal.dailyLogs.reduce((s, l) => s + (l.durationMinutes ?? 0), 0);
  const statusCfg = statusConfig[goal.status] ?? statusConfig.ACTIVE;

  return (
    <div className="flex flex-col h-full">
      <Header title={goal.title} />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-3xl space-y-4 fade-in">
          {/* Goal info */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-400">{goal.year}년 목표</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
            </div>
            {goal.description && (
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{goal.description}</p>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.05)" }}>
                <p className="text-xl font-black text-slate-800">{goal.monthlyPlans.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">월간 계획</p>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.05)" }}>
                <p className="text-xl font-black text-slate-800">{goal.dailyLogs.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">기록 수</p>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.05)" }}>
                <p className="text-xl font-black text-slate-800">{Math.floor(totalMinutes / 60)}h</p>
                <p className="text-xs text-slate-400 mt-0.5">{totalMinutes % 60}분 포함</p>
              </div>
            </div>
          </div>

          {/* Monthly plans */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">월간 계획</h3>
            {goal.monthlyPlans.length === 0 ? (
              <p className="text-sm text-slate-400">연결된 월간 계획이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {goal.monthlyPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-slate-50"
                  >
                    <span className="text-xs text-slate-400 shrink-0 font-mono">
                      {plan.year}.{String(plan.month).padStart(2, "0")}
                    </span>
                    <span className="text-slate-700 flex-1">{plan.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent daily logs */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">최근 기록</h3>
            {goal.dailyLogs.length === 0 ? (
              <p className="text-sm text-slate-400">아직 기록이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {goal.dailyLogs.map((log) => {
                  const cfg = alignmentConfig[log.alignmentType] ?? alignmentConfig.UNRELATED;
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-xs text-slate-400 shrink-0 font-mono">
                        {new Date(log.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                      </span>
                      <span className="flex-1 text-slate-700 truncate">{log.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cfg.className}`}>
                        {cfg.label}
                      </span>
                      {log.durationMinutes && (
                        <span className="text-xs text-slate-400 shrink-0">{log.durationMinutes}분</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/goals"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            목표 목록으로
          </Link>
        </div>
      </div>
    </div>
  );
}
