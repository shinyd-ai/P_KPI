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
    <div className="space-y-4">
      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-zinc-800">{stats.totalLogs}</p>
          <p className="text-xs text-zinc-400 mt-1">총 기록 수</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-zinc-800">
            {Math.floor(stats.totalMinutes / 60)}h
          </p>
          <p className="text-xs text-zinc-400 mt-1">{stats.totalMinutes % 60}분 포함</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.monthlyLinkedPct}%</p>
          <p className="text-xs text-zinc-400 mt-1">📌 월간연결</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.goalAlignedPct}%</p>
          <p className="text-xs text-zinc-400 mt-1">🎯 목표연관</p>
        </div>
      </div>

      {/* Alignment bar */}
      {stats.totalLogs > 0 && (
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-2">목표 정렬 분포</p>
          <div className="flex h-6 rounded-full overflow-hidden">
            {stats.monthlyLinked > 0 && (
              <div className="bg-blue-500" style={{ width: `${stats.monthlyLinkedPct}%` }} />
            )}
            {stats.goalAligned > 0 && (
              <div className="bg-amber-400" style={{ width: `${stats.goalAlignedPct}%` }} />
            )}
            {stats.unrelated > 0 && (
              <div className="bg-zinc-200" style={{ width: `${stats.unrelatedPct}%` }} />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 mt-2">
            <span>📌 {stats.monthlyLinked}회 ({stats.monthlyLinkedPct}%)</span>
            <span>🎯 {stats.goalAligned}회 ({stats.goalAlignedPct}%)</span>
            <span>⬜ {stats.unrelated}회 ({stats.unrelatedPct}%)</span>
          </div>
        </div>
      )}

      {/* Goal breakdown */}
      {Object.keys(stats.goalBreakdown).length > 0 && (
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-2">목표별 활동</p>
          <div className="space-y-1.5">
            {Object.entries(stats.goalBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([goal, count]) => (
                <div key={goal} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 text-zinc-700">🎯 {goal}</span>
                  <span className="text-zinc-400">{count}회</span>
                  <div className="w-20 bg-zinc-100 rounded-full h-1.5">
                    <div
                      className="bg-amber-400 h-1.5 rounded-full"
                      style={{ width: `${(count / stats.totalLogs) * 100}%` }}
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


