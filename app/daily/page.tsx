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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 bg-white md:px-6 md:py-4">
        {/* 모바일: 두 줄 / 데스크탑: 한 줄 */}
        <div className="flex flex-col gap-2 mb-3 md:flex-row md:items-center md:justify-between">
          {/* 날짜 네비게이션 행 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(selectedDate + "T00:00:00");
                d.setDate(d.getDate() - 1);
                setSelectedDate(toLocalDateString(d));
              }}
              className="p-2.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors md:p-1.5"
            >←</button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 md:flex-none"
            />
            <button
              onClick={() => {
                const d = new Date(selectedDate + "T00:00:00");
                d.setDate(d.getDate() + 1);
                setSelectedDate(toLocalDateString(d));
              }}
              className="p-2.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors md:p-1.5"
            >→</button>
            {/* 요일 텍스트: 모바일에서 숨김, md 이상에서 표시 */}
            <span className="hidden text-sm text-zinc-500 md:inline">
              {displayDate.toLocaleDateString("ko-KR", { weekday: "long", month: "long", day: "numeric" })}
              {isToday && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">오늘</span>}
            </span>
          </div>
          {/* 요일 텍스트: 모바일에서만 별도 행으로 표시 */}
          <span className="text-sm text-zinc-500 md:hidden">
            {displayDate.toLocaleDateString("ko-KR", { weekday: "long", month: "long", day: "numeric" })}
            {isToday && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">오늘</span>}
          </span>

          {/* Progress badge */}
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-zinc-600">
                <span className="text-blue-600 font-bold">{completedCount}</span>
                <span className="text-zinc-400">/{totalCount}</span>
                <span className="text-zinc-400 ml-1">완료</span>
              </div>
              <div className="w-20 h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setTab("morning")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "morning"
                ? "bg-amber-100 text-amber-700"
                : "text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            <span>🌅</span> 아침 계획
          </button>
          <button
            onClick={() => setTab("evening")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "evening"
                ? "bg-indigo-100 text-indigo-700"
                : "text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            <span>🌙</span> 저녁 체크
            {plans.some((p) => !p.completed) && totalCount > 0 && (
              <span className="w-2 h-2 bg-red-400 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-zinc-400">불러오는 중...</div>
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


