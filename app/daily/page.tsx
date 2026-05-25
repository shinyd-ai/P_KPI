"use client";

import { useState, useEffect, useCallback } from "react";
import MorningTab from "@/components/daily/MorningTab";
import EveningTab from "@/components/daily/EveningTab";

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDefaultTab(): "morning" | "evening" {
  const hour = new Date().getHours();
  return hour < 14 ? "morning" : "evening";
}

export interface DailyPlanCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface DailyPlan {
  id: string;
  date: string;
  title: string;
  completed: boolean;
  completedAt?: string | null;
  note?: string | null;
  rolledOver: boolean;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  monthlyPlan?: { id: string; title: string } | null;
  goal?: { id: string; title: string; category?: DailyPlanCategory | null } | null;
}

export default function DailyPage() {
  const today = toLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [tab, setTab] = useState<"morning" | "evening">(getDefaultTab());
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/daily-plans?date=${selectedDate}`);
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    let ignore = false;

    async function loadPlans() {
      try {
        const res = await fetch(`/api/daily-plans?date=${selectedDate}`);
        const data = await res.json();
        if (!ignore) setPlans(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadPlans();
    return () => { ignore = true; };
  }, [selectedDate]);

  const displayDate = new Date(selectedDate + "T00:00:00");
  const isToday = selectedDate === today;

  const completedCount = plans.filter((p) => p.completed).length;
  const totalCount = plans.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const navDay = (delta: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(toLocalDateString(d));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-3 md:px-6 md:py-4"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div className="flex flex-col gap-2 mb-3 md:flex-row md:items-center md:justify-between">
          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navDay(-1)}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white flex-1 md:flex-none"
            />
            <button
              onClick={() => navDay(1)}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <span className="hidden text-sm text-slate-500 md:inline">
              {displayDate.toLocaleDateString("ko-KR", { weekday: "long", month: "long", day: "numeric" })}
              {isToday && (
                <span
                  className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "linear-gradient(135deg, #e0e7ff, #ddd6fe)", color: "#6366f1" }}
                >
                  오늘
                </span>
              )}
            </span>
          </div>
          <span className="text-sm text-slate-500 md:hidden">
            {displayDate.toLocaleDateString("ko-KR", { weekday: "long", month: "long", day: "numeric" })}
            {isToday && (
              <span
                className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "linear-gradient(135deg, #e0e7ff, #ddd6fe)", color: "#6366f1" }}
              >
                오늘
              </span>
            )}
          </span>

          {/* Progress badge */}
          {totalCount > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="text-sm font-bold text-slate-700">
                <span style={{ color: "#4f7cff" }}>{completedCount}</span>
                <span className="text-slate-300 font-normal">/{totalCount}</span>
                <span className="text-xs text-slate-400 font-normal ml-1">완료</span>
              </div>
              <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${completionPct}%`,
                    background: completionPct === 100
                      ? "linear-gradient(90deg, #10b981, #059669)"
                      : "linear-gradient(90deg, #4f7cff, #6366f1)",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ background: "rgba(0,0,0,0.05)" }}
        >
          <button
            onClick={() => setTab("morning")}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={
              tab === "morning"
                ? { background: "#fff", color: "#92400e", boxShadow: "0 1px 3px rgba(0,0,0,0.10)" }
                : { color: "#94a3b8" }
            }
          >
            <span>🌅</span>
            <span>아침 계획</span>
          </button>
          <button
            onClick={() => setTab("evening")}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 relative"
            style={
              tab === "evening"
                ? { background: "#fff", color: "#4338ca", boxShadow: "0 1px 3px rgba(0,0,0,0.10)" }
                : { color: "#94a3b8" }
            }
          >
            <span>🌙</span>
            <span>저녁 체크</span>
            {plans.some((p) => !p.completed) && totalCount > 0 && (
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full pulse-dot" />
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-3 h-full text-slate-400">
            <span className="spinner" />
            <span className="text-sm">불러오는 중...</span>
          </div>
        ) : tab === "morning" ? (
          <MorningTab
            date={selectedDate}
            plans={plans}
            onRefresh={fetchPlans}
          />
        ) : (
          <EveningTab
            date={selectedDate}
            plans={plans}
            onRefresh={fetchPlans}
          />
        )}
      </div>
    </div>
  );
}
