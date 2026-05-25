"use client";

import { useState, useEffect } from "react";

// ─── 타입 정의 ───────────────────────────────────────────────
interface WeekDayPlan {
  id: string;
  title: string;
  completed: boolean;
  monthlyPlan?: { id: string; title: string } | null;
  goal?: { id: string; title: string } | null;
}

interface WeekDayLog {
  id: string;
  title: string;
  alignmentType: "MONTHLY_LINKED" | "GOAL_ALIGNED" | "UNRELATED";
  durationMinutes?: number | null;
}

interface WeekDay {
  date: string;
  plans: WeekDayPlan[];
  logs: WeekDayLog[];
  stats: {
    totalPlans: number;
    completedPlans: number;
    completionRate: number;
    totalLogMinutes: number;
  };
}

interface WeekStats {
  totalPlans: number;
  completedPlans: number;
  completionRate: number;
  monthlyLinked: number;
  goalAligned: number;
  unrelated: number;
  totalLogMinutes: number;
}

interface WeeklyData {
  days: WeekDay[];
  weekStats: WeekStats;
}

// ─── 유틸 함수 ───────────────────────────────────────────────
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=일, 1=월 ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

const cardStyle = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  boxShadow: "var(--card-shadow)",
};

// ─── 요일 카드 컴포넌트 ──────────────────────────────────────
interface DayCardProps {
  day: WeekDay;
  isToday: boolean;
  weekdayLabel: string;
}

function DayCard({ day, isToday, weekdayLabel }: DayCardProps) {
  const dateObj = new Date(day.date + "T00:00:00");
  const dateNum = dateObj.getDate();
  const { totalPlans, completedPlans, completionRate } = day.stats;
  const PLAN_LIMIT = 4;
  const visiblePlans = day.plans.slice(0, PLAN_LIMIT);
  const hiddenCount = day.plans.length - PLAN_LIMIT;

  return (
    <div
      className="rounded-2xl p-3 flex flex-col gap-2 transition-all duration-200"
      style={
        isToday
          ? {
              background: "var(--card-bg)",
              border: "1.5px solid rgba(99,102,241,0.45)",
              boxShadow: "0 0 0 3px rgba(99,102,241,0.08), var(--card-shadow)",
            }
          : cardStyle
      }
    >
      {/* 요일 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs font-bold ${isToday ? "text-indigo-600" : "text-slate-500"}`}
          >
            {weekdayLabel}
          </span>
          <span
            className={`text-sm font-bold ${isToday ? "text-indigo-700" : "text-slate-700"}`}
          >
            {dateNum}
          </span>
          {isToday && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "linear-gradient(135deg, #e0e7ff, #ddd6fe)", color: "#6366f1" }}
            >
              오늘
            </span>
          )}
        </div>
        {/* 달성률 */}
        {totalPlans > 0 && (
          <span className="text-xs font-semibold text-slate-500">
            {completedPlans}/{totalPlans}
          </span>
        )}
      </div>

      {/* 달성률 바 */}
      {totalPlans > 0 && (
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completionRate}%`,
              background:
                completionRate === 100
                  ? "linear-gradient(90deg, #10b981, #059669)"
                  : "linear-gradient(90deg, #4f7cff, #6366f1)",
            }}
          />
        </div>
      )}

      {/* 계획 목록 */}
      <div className="flex flex-col gap-1">
        {day.plans.length === 0 ? (
          <p className="text-xs text-slate-300 text-center py-1">계획 없음</p>
        ) : (
          <>
            {visiblePlans.map((plan) => (
              <div
                key={plan.id}
                className={`text-xs flex items-center gap-1.5 leading-snug ${
                  plan.completed ? "line-through text-slate-400" : "text-slate-600"
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${
                    plan.completed
                      ? "border-indigo-400 bg-indigo-400"
                      : "border-slate-300"
                  }`}
                >
                  {plan.completed && (
                    <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  )}
                </span>
                <span className="truncate">{plan.title}</span>
              </div>
            ))}
            {hiddenCount > 0 && (
              <p className="text-xs text-slate-400 pl-4.5">+{hiddenCount}개 더</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────
export default function WeeklyPage() {
  const [mondayDate, setMondayDate] = useState<Date>(() => getMonday(new Date()));
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);

  const todayStr = toLocalDateString(new Date());
  const startStr = toLocalDateString(mondayDate);

  // 주 끝 날짜 (일요일)
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);

  const formatRange = () => {
    const startMonth = mondayDate.getMonth() + 1;
    const startDay = mondayDate.getDate();
    const endMonth = sundayDate.getMonth() + 1;
    const endDay = sundayDate.getDate();
    const year = mondayDate.getFullYear();
    if (startMonth === endMonth) {
      return `${year}년 ${startMonth}월 ${startDay}일 ~ ${endDay}일`;
    }
    return `${year}년 ${startMonth}월 ${startDay}일 ~ ${endMonth}월 ${endDay}일`;
  };

  const goThisWeek = () => setMondayDate(getMonday(new Date()));
  const goPrevWeek = () => {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() - 7);
    setMondayDate(d);
  };
  const goNextWeek = () => {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + 7);
    setMondayDate(d);
  };

  const isThisWeek = toLocalDateString(getMonday(new Date())) === startStr;

  useEffect(() => {
    let ignore = false;

    async function fetchWeekly() {
      if (!ignore) setLoading(true);
      try {
        const res = await fetch(`/api/weekly?startDate=${startStr}`);
        const data = await res.json();
        if (!ignore) setWeeklyData(data);
      } catch (e) {
        console.error(e);
        if (!ignore) setWeeklyData(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchWeekly();
    return () => { ignore = true; };
  }, [startStr]);

  // 주간 요약 계산 (API 응답이 없을 경우 days에서 직접 계산)
  const stats = weeklyData?.weekStats ?? null;
  const days = weeklyData?.days ?? [];

  const totalLogMinutes = stats?.totalLogMinutes ?? 0;
  const completionRate = stats?.completionRate ?? 0;
  const totalPlans = stats?.totalPlans ?? 0;
  const completedPlans = stats?.completedPlans ?? 0;
  const monthlyLinked = stats?.monthlyLinked ?? 0;
  const goalAligned = stats?.goalAligned ?? 0;
  const unrelated = stats?.unrelated ?? 0;
  const totalLogs = monthlyLinked + goalAligned + unrelated;
  const pct = (n: number) => (totalLogs > 0 ? Math.round((n / totalLogs) * 100) : 0);

  return (
    <div className="flex flex-col h-full">
      {/* ── Sticky 헤더 ── */}
      <div
        className="px-4 py-3 md:px-6 md:py-4"
        style={{
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">주간 뷰</h2>
          </div>

          {/* 주 네비게이션 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={goPrevWeek}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              aria-label="이전 주"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-sm font-medium text-slate-700 min-w-0">{formatRange()}</span>
            <button
              onClick={goNextWeek}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              aria-label="다음 주"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            {!isThisWeek && (
              <button
                onClick={goThisWeek}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(79,124,255,0.30)",
                }}
              >
                이번 주
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-3 text-slate-400 py-20">
            <span className="spinner" />
            <span className="text-sm">불러오는 중...</span>
          </div>
        ) : (
          <div className="space-y-4 fade-in">
            {/* ── 주간 요약 카드 ── */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* 전체 달성률 */}
              <div className="rounded-2xl p-5 transition-all duration-200" style={cardStyle}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">전체 달성률</p>
                <div className="flex items-end gap-3 mb-3">
                  <span
                    className="text-4xl font-black tracking-tight"
                    style={{ color: completionRate === 100 ? "#10b981" : "#4f7cff" }}
                  >
                    {completionRate}%
                  </span>
                  <span className="text-sm text-slate-400 mb-1">{completedPlans}/{totalPlans}개</span>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${completionRate}%`,
                      background:
                        completionRate === 100
                          ? "linear-gradient(90deg, #10b981, #059669)"
                          : "linear-gradient(90deg, #4f7cff, #6366f1)",
                    }}
                  />
                </div>
              </div>

              {/* 목표 정렬 비율 */}
              <div className="rounded-2xl p-5 transition-all duration-200" style={cardStyle}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">목표 정렬 비율</p>
                {totalLogs === 0 ? (
                  <p className="text-sm text-slate-300 py-2">기록 없음</p>
                ) : (
                  <>
                    <div className="flex h-2.5 rounded-full overflow-hidden mb-3" style={{ background: "#f1f5f9" }}>
                      {monthlyLinked > 0 && (
                        <div
                          className="transition-all duration-700"
                          style={{ width: `${pct(monthlyLinked)}%`, background: "linear-gradient(90deg, #6366f1, #818cf8)" }}
                        />
                      )}
                      {goalAligned > 0 && (
                        <div
                          className="transition-all duration-700"
                          style={{ width: `${pct(goalAligned)}%`, background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }}
                        />
                      )}
                      {unrelated > 0 && (
                        <div
                          className="bg-slate-200 transition-all duration-700"
                          style={{ width: `${pct(unrelated)}%` }}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }} />
                        <span className="text-slate-600">월간연결 {pct(monthlyLinked)}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }} />
                        <span className="text-slate-600">목표연관 {pct(goalAligned)}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-200 shrink-0" />
                        <span className="text-slate-600">기타 {pct(unrelated)}%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 총 활동 시간 */}
              <div className="rounded-2xl p-5 transition-all duration-200" style={cardStyle}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">총 활동 시간</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black tracking-tight text-slate-800">
                    {Math.floor(totalLogMinutes / 60)}
                  </span>
                  <span className="text-slate-400 text-sm mb-1">시간</span>
                  {totalLogMinutes % 60 > 0 && (
                    <>
                      <span className="text-2xl font-bold text-slate-600">
                        {totalLogMinutes % 60}
                      </span>
                      <span className="text-slate-400 text-sm mb-1">분</span>
                    </>
                  )}
                </div>
                {totalLogMinutes === 0 && (
                  <p className="text-sm text-slate-300 mt-1">기록 없음</p>
                )}
              </div>
            </div>

            {/* ── 요일별 카드 그리드 ── */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">요일별 현황</p>

              {/* 모바일: 1열 세로 스크롤 / 데스크탑: 7열 그리드 */}
              <div className="flex flex-col gap-3 md:grid md:grid-cols-7 md:gap-3">
                {WEEKDAY_LABELS.map((label, idx) => {
                  const targetDate = new Date(mondayDate);
                  targetDate.setDate(mondayDate.getDate() + idx);
                  const dateStr = toLocalDateString(targetDate);
                  const isToday = dateStr === todayStr;

                  // API 응답에서 해당 날짜 찾기 (없으면 빈 구조)
                  const dayData: WeekDay = days.find((d) => d.date === dateStr) ?? {
                    date: dateStr,
                    plans: [],
                    logs: [],
                    stats: {
                      totalPlans: 0,
                      completedPlans: 0,
                      completionRate: 0,
                      totalLogMinutes: 0,
                    },
                  };

                  return (
                    <DayCard
                      key={dateStr}
                      day={dayData}
                      isToday={isToday}
                      weekdayLabel={label}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
