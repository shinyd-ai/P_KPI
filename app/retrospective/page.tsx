"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface MonthlyPlan {
  id: string;
  year: number;
  month: number;
  title: string;
  description?: string | null;
  status: "ACTIVE" | "COMPLETED" | "PARTIAL" | "MISSED" | "DROPPED";
  resultMemo?: string | null;
  goal?: { id: string; title: string; category?: Category | null } | null;
  _count?: { dailyLogs: number };
}

interface MonthlyResults {
  totalDailyPlans: number;
  completedDailyPlans: number;
  completionRate: number;
  totalEstimatedMinutes: number;
  totalActualMinutes: number;
  timeDiff: number;
  totalLogs: number;
  totalLogMinutes: number;
  monthlyLinkedPct: number;
  goalAlignedPct: number;
  unrelatedPct: number;
}

interface RetrospectiveContent {
  summary: string;
  lessons: string;
  risks: string;
  mood: string;
  blogOpening: string;
}

const emptyContent: RetrospectiveContent = {
  summary: "",
  lessons: "",
  risks: "",
  mood: "",
  blogOpening: "",
};

const cardStyle = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  boxShadow: "var(--card-shadow)",
};

const statusLabel: Record<MonthlyPlan["status"], string> = {
  ACTIVE: "진행중",
  COMPLETED: "완료",
  PARTIAL: "일부 완료",
  MISSED: "미달성",
  DROPPED: "중단",
};

function nextMonthOf(year: number, month: number) {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

function isResultOnlyPlan(plan: MonthlyPlan) {
  return plan.title.startsWith("[실적] ");
}

function displayTitle(plan: MonthlyPlan) {
  return plan.title.replace(/^\[실적\]\s*/, "");
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatMinutes(minutes: number) {
  if (!minutes) return "0분";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

function groupPlans(plans: MonthlyPlan[]) {
  const grouped = new Map<string, { category: Category | null; plans: MonthlyPlan[] }>();

  for (const plan of plans) {
    const category = plan.goal?.category ?? null;
    const key = category?.id ?? "__none__";
    const current = grouped.get(key) ?? { category, plans: [] };
    current.plans.push(plan);
    grouped.set(key, current);
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (!a.category && b.category) return 1;
    if (a.category && !b.category) return -1;
    return (a.category?.name ?? "").localeCompare(b.category?.name ?? "");
  });
}

function generateBlogDraft(params: {
  year: number;
  month: number;
  content: RetrospectiveContent;
  plans: MonthlyPlan[];
  nextPlans: MonthlyPlan[];
}) {
  const { year, month, content, plans, nextPlans } = params;
  const next = nextMonthOf(year, month);
  const completed = plans.filter((plan) => plan.status === "COMPLETED" || plan.resultMemo || isResultOnlyPlan(plan));
  const opening = content.blogOpening.trim() || `벌써 ${month}월이 끝났다. 기록하고 보니 이번 달도 생각보다 많은 일을 했다.`;

  const sections: string[] = [
    opening,
    "",
    `${year}년 ${month}월 회고`,
    "",
  ];

  if (content.summary.trim()) {
    sections.push("이번 달 요약", content.summary.trim(), "");
  }

  sections.push(`${month}월 실적`);
  if (completed.length === 0) {
    sections.push("- 아직 정리된 실적이 없습니다.");
  } else {
    for (const plan of completed) {
      const memo = plan.resultMemo?.trim();
      sections.push(`- ${displayTitle(plan)}${memo ? `: ${memo}` : ""}`);
    }
  }
  sections.push("");

  if (content.lessons.trim()) {
    sections.push("배운 점", ...splitLines(content.lessons).map((line) => `- ${line}`), "");
  }

  if (content.risks.trim()) {
    sections.push("이슈와 리스크", ...splitLines(content.risks).map((line) => `- ${line}`), "");
  }

  if (content.mood.trim()) {
    sections.push("느낀 점", content.mood.trim(), "");
  }

  sections.push(`${next.month}월 계획`);
  if (nextPlans.length === 0) {
    sections.push("- 다음 달 계획을 월간 계획에 추가하면 여기에 표시됩니다.");
  } else {
    for (const plan of nextPlans) {
      sections.push(`- ${displayTitle(plan)}${plan.description ? `: ${plan.description}` : ""}`);
    }
  }

  return sections.join("\n");
}

function TextAreaField({
  label,
  value,
  placeholder,
  rows = 4,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition-colors focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        placeholder={placeholder}
      />
    </label>
  );
}

export default function RetrospectivePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [plans, setPlans] = useState<MonthlyPlan[]>([]);
  const [nextPlans, setNextPlans] = useState<MonthlyPlan[]>([]);
  const [results, setResults] = useState<MonthlyResults | null>(null);
  const [content, setContent] = useState<RetrospectiveContent>(emptyContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const next = nextMonthOf(year, month);

    async function loadData() {
      setLoading(true);
      setError("");
      setSaveMessage("");

      try {
        const [plansRes, nextPlansRes, resultsRes, retrospectiveRes] = await Promise.all([
          fetch(`/api/monthly-plans?year=${year}&month=${month}`),
          fetch(`/api/monthly-plans?year=${next.year}&month=${next.month}`),
          fetch(`/api/monthly-results?year=${year}&month=${month}`),
          fetch(`/api/retrospectives/${year}/${month}`),
        ]);

        if (!plansRes.ok || !nextPlansRes.ok || !resultsRes.ok || !retrospectiveRes.ok) {
          throw new Error("월간 회고 데이터를 불러오지 못했습니다.");
        }

        const [plansData, nextPlansData, resultsData, retrospectiveData] = await Promise.all([
          plansRes.json(),
          nextPlansRes.json(),
          resultsRes.json(),
          retrospectiveRes.json(),
        ]);

        if (ignore) return;

        setPlans(Array.isArray(plansData) ? plansData : []);
        setNextPlans(Array.isArray(nextPlansData) ? nextPlansData : []);
        setResults(resultsData);
        setContent({ ...emptyContent, ...(retrospectiveData.content ?? {}) });
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [year, month]);

  const plannedItems = plans.filter((plan) => !isResultOnlyPlan(plan));
  const completedPlans = plannedItems.filter((plan) => plan.status === "COMPLETED");
  const resultMemos = plans.filter((plan) => plan.resultMemo?.trim() || isResultOnlyPlan(plan));
  const groupedPlans = useMemo(() => groupPlans(plans), [plans]);
  const blogDraft = useMemo(
    () => generateBlogDraft({ year, month, content, plans, nextPlans }),
    [year, month, content, plans, nextPlans]
  );

  async function saveRetrospective() {
    setSaving(true);
    setSaveMessage("");
    setError("");

    try {
      const res = await fetch(`/api/retrospectives/${year}/${month}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      if (!res.ok) {
        throw new Error("월간 회고 저장에 실패했습니다.");
      }

      setSaveMessage("저장되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(blogDraft);
      setCopyMessage("복사되었습니다.");
    } catch {
      setCopyMessage("복사 권한이 없어 직접 선택해 복사해주세요.");
    }
  }

  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const currentYear = now.getFullYear();
  const completionRate =
    plannedItems.length > 0 ? Math.round((completedPlans.length / plannedItems.length) * 100) : 0;

  return (
    <div className="flex h-full flex-col">
      <Header title="월간 회고" />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
          <select
            value={year}
            onChange={(event) => setYear(parseInt(event.target.value, 10))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 md:w-auto"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((item) => (
              <option key={item} value={item}>
                {item}년
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1">
            {months.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMonth(item)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all"
                style={
                  month === item
                    ? { background: "#4f7cff", color: "#fff" }
                    : { background: "#fff", color: "#64748b", border: "1px solid rgba(0,0,0,0.07)" }
                }
              >
                {item}월
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={saveRetrospective}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-all disabled:opacity-50 md:ml-auto"
            style={{
              background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
              boxShadow: "0 2px 8px rgba(79,124,255,0.35)",
            }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>

        {(error || saveMessage) && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              error ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || saveMessage}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-slate-400">
            <span className="spinner" />
            <span className="text-sm">불러오는 중...</span>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
            <section className="space-y-5">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  ["월간 계획", plannedItems.length.toString(), `${completedPlans.length}개 완료`],
                  ["완료율", `${completionRate}%`, "계획 기준"],
                  ["일간 기록", (results?.totalLogs ?? 0).toString(), `${results?.monthlyLinkedPct ?? 0}% 월간 연결`],
                  ["활동 시간", formatMinutes(results?.totalActualMinutes ?? 0), "실제 기록"],
                ].map(([label, value, caption]) => (
                  <div key={label} className="rounded-2xl p-4" style={cardStyle}>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
                    <p className="mt-1 text-xs text-slate-400">{caption}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl p-5" style={cardStyle}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900">{year}년 {month}월 자동 요약</h2>
                    <p className="mt-1 text-sm text-slate-500">저장된 계획, 결과 메모, 일간 기록만 사용합니다.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">LLM 미사용</span>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-400">완료된 계획</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {completedPlans.length > 0
                        ? completedPlans.slice(0, 3).map(displayTitle).join(", ")
                        : "완료 처리된 계획이 없습니다."}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-400">결과 메모</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {resultMemos.length > 0 ? `${resultMemos.length}개 항목에 실적 메모가 있습니다.` : "아직 실적 메모가 없습니다."}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-400">목표 정렬</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      월간 계획 연결 {results?.monthlyLinkedPct ?? 0}%, 연간 목표 연결 {results?.goalAlignedPct ?? 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {groupedPlans.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                    <p className="text-sm font-semibold text-slate-600">이번 달 월간 계획이 없습니다.</p>
                    <p className="mt-1 text-sm text-slate-400">월간 계획을 추가하면 회고 화면에서 자동으로 묶어 보여줍니다.</p>
                  </div>
                ) : (
                  groupedPlans.map((group) => {
                    const category = group.category;
                    return (
                      <article key={category?.id ?? "__none__"} className="rounded-2xl p-5" style={cardStyle}>
                        <div className="mb-4 flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black"
                            style={{
                              backgroundColor: category?.color ? `${category.color}20` : "#f1f5f9",
                              color: category?.color ?? "#64748b",
                            }}
                          >
                            {category?.icon ?? "•"}
                          </span>
                          <div>
                            <h3 className="text-sm font-black text-slate-900">{category?.name ?? "미분류"}</h3>
                            <p className="text-xs text-slate-400">{group.plans.length}개 항목</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {group.plans.map((plan) => (
                            <div key={plan.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-800">{displayTitle(plan)}</p>
                                  {plan.resultMemo && (
                                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{plan.resultMemo}</p>
                                  )}
                                </div>
                                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
                                  {statusLabel[plan.status]}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl p-5" style={cardStyle}>
                <h2 className="text-base font-black text-slate-900">직접 회고</h2>
                <p className="mt-1 text-sm text-slate-500">숫자는 앱이 정리하고, 해석은 직접 남기는 영역입니다.</p>

                <div className="mt-5 space-y-4">
                  <TextAreaField
                    label="한 달 요약"
                    value={content.summary}
                    placeholder="이번 달을 한 문단으로 정리해보세요."
                    rows={4}
                    onChange={(value) => setContent((prev) => ({ ...prev, summary: value }))}
                  />
                  <TextAreaField
                    label="배운 점"
                    value={content.lessons}
                    placeholder="새로 알게 된 것, 다음에도 반복하고 싶은 방식을 적어보세요."
                    rows={4}
                    onChange={(value) => setContent((prev) => ({ ...prev, lessons: value }))}
                  />
                  <TextAreaField
                    label="이슈 / 리스크"
                    value={content.risks}
                    placeholder="막힌 점, 손실, 미뤄진 일, 관리해야 할 위험을 적어보세요."
                    rows={4}
                    onChange={(value) => setContent((prev) => ({ ...prev, risks: value }))}
                  />
                  <TextAreaField
                    label="느낀 점"
                    value={content.mood}
                    placeholder="기분, 체감, 한 달을 지나며 든 생각을 적어보세요."
                    rows={3}
                    onChange={(value) => setContent((prev) => ({ ...prev, mood: value }))}
                  />
                  <TextAreaField
                    label="블로그 도입문"
                    value={content.blogOpening}
                    placeholder="블로그 글 첫 문단으로 쓰고 싶은 말을 적어보세요."
                    rows={3}
                    onChange={(value) => setContent((prev) => ({ ...prev, blogOpening: value }))}
                  />
                </div>
              </section>

              <section className="rounded-2xl p-5" style={cardStyle}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900">블로그 초안</h2>
                    <p className="mt-1 text-sm text-slate-500">입력 내용과 월간 기록을 정해진 형식으로 합칩니다.</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyDraft}
                    className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    복사
                  </button>
                </div>
                {copyMessage && <p className="mb-3 text-xs font-semibold text-emerald-600">{copyMessage}</p>}
                <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {blogDraft}
                </pre>
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
