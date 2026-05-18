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

const alignmentLabel: Record<string, string> = {
  MONTHLY_LINKED: "📌 월간연결",
  GOAL_ALIGNED: "🎯 목표연관",
  UNRELATED: "⬜ 기타",
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

  if (loading) return <div className="flex-1 flex items-center justify-center text-zinc-400">불러오는 중...</div>;
  if (!goal) return null;

  const totalMinutes = goal.dailyLogs.reduce((s, l) => s + (l.durationMinutes ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      <Header title={goal.title} />
      <div className="flex-1 p-6 overflow-auto max-w-3xl">
        {/* Goal info */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-zinc-400">{goal.year}년 목표</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              goal.status === "ACTIVE" ? "bg-green-100 text-green-700" :
              goal.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
              "bg-zinc-100 text-zinc-500"
            }`}>
              {goal.status === "ACTIVE" ? "진행 중" : goal.status === "COMPLETED" ? "완료" : "중단"}
            </span>
          </div>
          {goal.description && <p className="text-sm text-zinc-600">{goal.description}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-sm text-zinc-500">
            <span>월간 계획 {goal.monthlyPlans.length}개</span>
            <span>기록 {goal.dailyLogs.length}회</span>
            <span>총 {Math.floor(totalMinutes / 60)}시간 {totalMinutes % 60}분</span>
          </div>
        </div>

        {/* Monthly plans */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">월간 계획</h3>
          {goal.monthlyPlans.length === 0 ? (
            <p className="text-sm text-zinc-400">연결된 월간 계획이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {goal.monthlyPlans.map((plan) => (
                <div key={plan.id} className="bg-white border border-zinc-200 rounded-lg px-4 py-3 text-sm">
                  <span className="text-zinc-400 mr-2">{plan.year}.{String(plan.month).padStart(2, "0")}</span>
                  <span className="text-zinc-800">{plan.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent daily logs */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">최근 기록</h3>
          {goal.dailyLogs.length === 0 ? (
            <p className="text-sm text-zinc-400">아직 기록이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {goal.dailyLogs.map((log) => (
                <div key={log.id} className="bg-white border border-zinc-200 rounded-lg px-4 py-3 flex items-center gap-3 text-sm">
                  <span className="text-zinc-400 shrink-0">
                    {new Date(log.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  </span>
                  <span className="flex-1 text-zinc-800">{log.title}</span>
                  <span className="text-xs">{alignmentLabel[log.alignmentType]}</span>
                  {log.durationMinutes && (
                    <span className="text-zinc-400 text-xs shrink-0">{log.durationMinutes}분</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link href="/goals" className="text-sm text-zinc-500 hover:text-zinc-700">← 목표 목록으로</Link>
        </div>
      </div>
    </div>
  );
}


