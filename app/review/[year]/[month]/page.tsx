"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReviewStats from "@/components/review/ReviewStats";

interface Review {
  id: string;
  year: number;
  month: number;
  content: string;
  stats: {
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
  };
  createdAt: string;
}

interface Suggestion {
  title: string;
  description: string;
  goalId?: string;
}

const cardStyle = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  boxShadow: "var(--card-shadow)",
};

export default function ReviewPage() {
  const { year: yearStr, month: monthStr } = useParams<{ year: string; month: string }>();
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 다음 달 계획 추천 상태
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [addingItems, setAddingItems] = useState<Set<number>>(new Set());

  // 다음 달 year/month 계산
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  useEffect(() => {
    let ignore = false;

    async function loadReview() {
      try {
        const res = await fetch(`/api/reviews/${year}/${month}`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setReview(data);
            setEditContent(data.content);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadReview();
    return () => { ignore = true; };
  }, [year, month]);

  async function generateReview() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/reviews/${year}/${month}`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "회고 생성 실패");
      }
      const data = await res.json();
      setReview(data);
      setEditContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setGenerating(false);
    }
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const res = await fetch(`/api/reviews/${year}/${month}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error("저장 실패");
      const data = await res.json();
      setReview(data);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  }

  async function fetchSuggestions() {
    setSuggestionsLoading(true);
    setSuggestionsError("");
    try {
      const res = await fetch(`/api/reviews/${year}/${month}/suggestions`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "추천 불러오기 실패");
      }
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setAddedItems(new Set());
    } catch (err) {
      setSuggestionsError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setSuggestionsLoading(false);
    }
  }

  async function addToNextMonth(suggestion: Suggestion, index: number) {
    setAddingItems((prev) => new Set(prev).add(index));
    try {
      const res = await fetch("/api/monthly-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: nextYear,
          month: nextMonth,
          title: suggestion.title,
          description: suggestion.description,
          ...(suggestion.goalId ? { goalId: suggestion.goalId } : {}),
        }),
      });
      if (!res.ok) throw new Error("추가 실패");
      setAddedItems((prev) => new Set(prev).add(index));
    } catch (err) {
      setSuggestionsError(err instanceof Error ? err.message : "추가 중 오류가 발생했습니다");
    } finally {
      setAddingItems((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }

  const monthName = `${year}년 ${month}월`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6"
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
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{monthName} 회고</h2>
          <Link
            href="/monthly"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors mt-0.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            월간 계획으로
          </Link>
        </div>
        <div className="flex gap-2 self-end md:self-auto">
          {review && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              수정
            </button>
          )}
          <button
            onClick={generateReview}
            disabled={generating}
            className="px-4 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
              boxShadow: "0 2px 8px rgba(79,124,255,0.35)",
            }}
          >
            {generating ? "생성 중..." : review ? "재생성" : "AI 회고 생성"}
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-3xl space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-3 text-slate-400 py-20">
              <span className="spinner" />
              <span className="text-sm">불러오는 중...</span>
            </div>
          ) : generating ? (
            <div className="text-center py-20">
              <div
                className="inline-flex items-center gap-4 px-6 py-5 rounded-2xl"
                style={cardStyle}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)" }}>
                  <span className="text-xl">🤖</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-700">Claude가 회고를 작성하고 있습니다...</p>
                  <p className="text-sm text-slate-400 mt-0.5">이번 달 데이터를 분석 중입니다</p>
                </div>
              </div>
            </div>
          ) : !review ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-slate-700 font-semibold mb-1">{monthName} 회고가 없습니다</p>
              <p className="text-sm text-slate-400 mb-5">
                이번 달 기록이 있다면 AI가 자동으로 회고를 생성해드립니다
              </p>
              <button
                onClick={generateReview}
                className="px-6 py-3 text-white rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                  boxShadow: "0 2px 8px rgba(79,124,255,0.35)",
                }}
              >
                AI 회고 생성하기
              </button>
            </div>
          ) : (
            <div className="fade-in space-y-4">
              {/* Stats */}
              <div className="rounded-2xl p-5" style={cardStyle}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">이달의 통계</h3>
                <ReviewStats stats={review.stats} />
              </div>

              {/* Review content */}
              <div className="rounded-2xl p-5" style={cardStyle}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #e0e7ff, #ddd6fe)" }}>
                      <span className="text-sm">🤖</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">AI 회고</h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(review.createdAt).toLocaleDateString("ko-KR")} 생성
                  </span>
                </div>

                {editing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={20}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-slate-50 focus:bg-white transition-colors"
                    />
                    <div className="flex gap-2.5">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="px-6 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all hover:scale-[1.01]"
                        style={{
                          background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                          boxShadow: "0 2px 6px rgba(79,124,255,0.3)",
                        }}
                      >
                        {saving ? "저장 중..." : "저장"}
                      </button>
                      <button
                        onClick={() => { setEditing(false); setEditContent(review.content); }}
                        className="px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-slate-700">
                    {review.content.split("\n").map((line, i) => {
                      if (line.startsWith("## ")) {
                        return (
                          <h2 key={i} className="text-base font-bold text-slate-800 mt-5 mb-2 first:mt-0 pb-1.5"
                            style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            {line.slice(3)}
                          </h2>
                        );
                      }
                      if (line.startsWith("### ")) {
                        return (
                          <h3 key={i} className="text-sm font-semibold text-slate-700 mt-4 mb-1">
                            {line.slice(4)}
                          </h3>
                        );
                      }
                      if (line.startsWith("- ")) {
                        return (
                          <p key={i} className="text-sm pl-3 text-slate-600 leading-relaxed flex gap-2">
                            <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
                            <span>{line.slice(2)}</span>
                          </p>
                        );
                      }
                      if (line === "") {
                        return <div key={i} className="h-2" />;
                      }
                      return <p key={i} className="text-sm text-slate-700 leading-relaxed">{line}</p>;
                    })}
                  </div>
                )}
              </div>

              {/* 다음 달 계획 추천 섹션 */}
              <div className="rounded-2xl p-5" style={cardStyle}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      다음 달 계획 추천
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {nextYear}년 {nextMonth}월 계획으로 바로 추가할 수 있습니다
                    </p>
                  </div>
                  <button
                    onClick={fetchSuggestions}
                    disabled={suggestionsLoading}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                      boxShadow: "0 2px 8px rgba(79,124,255,0.35)",
                    }}
                  >
                    {suggestionsLoading ? (
                      <>
                        <span className="spinner" style={{ width: 12, height: 12 }} />
                        분석 중...
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        추천 받기
                      </>
                    )}
                  </button>
                </div>

                {suggestionsError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-xs mb-3">
                    {suggestionsError}
                  </div>
                )}

                {suggestions.length === 0 && !suggestionsLoading && !suggestionsError && (
                  <p className="text-xs text-slate-400 text-center py-4">
                    회고를 바탕으로 다음 달 계획을 AI가 추천해드립니다
                  </p>
                )}

                {suggestions.length > 0 && (
                  <div className="space-y-2.5">
                    {suggestions.map((s, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-4 flex items-start justify-between gap-3"
                        style={{
                          background: "linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%)",
                          border: "1px solid rgba(99,102,241,0.12)",
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 leading-snug">{s.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.description}</p>
                        </div>
                        <button
                          onClick={() => addToNextMonth(s, i)}
                          disabled={addedItems.has(i) || addingItems.has(i)}
                          className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-60 transition-all hover:scale-[1.03] active:scale-[0.97]"
                          style={
                            addedItems.has(i)
                              ? {
                                  background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                                  color: "#065f46",
                                  border: "1px solid rgba(5,150,105,0.2)",
                                }
                              : {
                                  background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                                  color: "#fff",
                                  boxShadow: "0 1px 4px rgba(79,124,255,0.3)",
                                }
                          }
                        >
                          {addingItems.has(i) ? (
                            <>
                              <span className="spinner" style={{ width: 10, height: 10 }} />
                              추가 중
                            </>
                          ) : addedItems.has(i) ? (
                            "추가됨 ✓"
                          ) : (
                            <>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              다음 달 계획에 추가
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
