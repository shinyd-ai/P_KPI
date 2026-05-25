interface Stats {
  totalLogs: number;
  totalMinutes: number;
  monthlyLinked: number;
  goalAligned: number;
  unrelated: number;
  monthlyLinkedPct: number;
  goalAlignedPct: number;
  unrelatedPct: number;
  goalBreakdown: Record<string, number>;
  planBreakdown: Record<string, number>;
}

interface ReviewStatsProps {
  stats: Stats;
}

export default function ReviewStats({ stats }: ReviewStatsProps) {
  return (
    <div className="space-y-5">
      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <p className="text-2xl font-black text-slate-800">{stats.totalLogs}</p>
          <p className="text-xs text-slate-400 mt-1">총 기록 수</p>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <p className="text-2xl font-black text-slate-800">
            {Math.floor(stats.totalMinutes / 60)}h
          </p>
          <p className="text-xs text-slate-400 mt-1">{stats.totalMinutes % 60}분 포함</p>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)", border: "1px solid #c7d2fe" }}
        >
          <p className="text-2xl font-black text-indigo-600">{stats.monthlyLinkedPct}%</p>
          <p className="text-xs text-slate-500 mt-1">월간연결</p>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", border: "1px solid #fcd34d" }}
        >
          <p className="text-2xl font-black text-amber-600">{stats.goalAlignedPct}%</p>
          <p className="text-xs text-slate-500 mt-1">목표연관</p>
        </div>
      </div>

      {/* Alignment bar */}
      {stats.totalLogs > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">목표 정렬 분포</p>
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
            {stats.monthlyLinked > 0 && (
              <div
                className="transition-all"
                style={{
                  width: `${stats.monthlyLinkedPct}%`,
                  background: "linear-gradient(90deg, #6366f1, #818cf8)",
                }}
              />
            )}
            {stats.goalAligned > 0 && (
              <div
                className="transition-all"
                style={{
                  width: `${stats.goalAlignedPct}%`,
                  background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                }}
              />
            )}
            {stats.unrelated > 0 && (
              <div
                className="bg-slate-200 transition-all"
                style={{ width: `${stats.unrelatedPct}%` }}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }} />
              월간연결 {stats.monthlyLinked}회 ({stats.monthlyLinkedPct}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }} />
              목표연관 {stats.goalAligned}회 ({stats.goalAlignedPct}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" />
              기타 {stats.unrelated}회 ({stats.unrelatedPct}%)
            </span>
          </div>
        </div>
      )}

      {/* Goal breakdown */}
      {Object.keys(stats.goalBreakdown).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">목표별 활동</p>
          <div className="space-y-2">
            {Object.entries(stats.goalBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([goal, count]) => (
                <div key={goal} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 text-slate-700 truncate">{goal}</span>
                  <span className="text-xs text-slate-400 shrink-0">{count}회</span>
                  <div className="w-20 rounded-full h-1.5 shrink-0" style={{ background: "rgba(0,0,0,0.07)" }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${(count / stats.totalLogs) * 100}%`,
                        background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
