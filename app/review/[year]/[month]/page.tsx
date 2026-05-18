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

  const monthName = `${year}년 ${month}월`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-3 px-4 py-4 border-b border-zinc-200 bg-white md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-800">{monthName} 회고</h2>
          <Link href="/monthly" className="text-sm text-zinc-400 hover:text-zinc-600">
            ← 월간 계획으로
          </Link>
        </div>
        <div className="flex gap-2 self-end md:self-auto">
          {review && !editing && (
            <button
              onClick={() => { setEditing(true); }}
              className="px-4 py-2 bg-zinc-100 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors"
            >
              수정
            </button>
          )}
          <button
            onClick={generateReview}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {generating ? "생성 중..." : review ? "재생성" : "AI 회고 생성"}
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-zinc-400 py-20">불러오는 중...</div>
          ) : generating ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center gap-3 text-zinc-500">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="font-medium">Claude가 회고를 작성하고 있습니다...</p>
                  <p className="text-sm text-zinc-400 mt-1">이번 달 데이터를 분석 중입니다</p>
                </div>
              </div>
            </div>
          ) : !review ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">📋</p>
              <p className="text-zinc-600 font-medium mb-2">{monthName} 회고가 없습니다</p>
              <p className="text-sm text-zinc-400 mb-6">
                이번 달 기록이 있다면 AI가 자동으로 회고를 생성해드립니다
              </p>
              <button
                onClick={generateReview}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                🤖 AI 회고 생성하기
              </button>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                <h3 className="font-semibold text-zinc-800 mb-4">📊 이달의 통계</h3>
                <ReviewStats stats={review.stats} />
              </div>

              {/* Review content */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-zinc-800">🤖 AI 회고</h3>
                  <span className="text-xs text-zinc-400">
                    {new Date(review.createdAt).toLocaleDateString("ko-KR")} 생성
                  </span>
                </div>

                {editing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={20}
                      className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? "저장 중..." : "저장"}
                      </button>
                      <button
                        onClick={() => { setEditing(false); setEditContent(review.content); }}
                        className="px-6 py-2 bg-zinc-100 text-zinc-700 text-sm rounded-lg hover:bg-zinc-200 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-zinc-700">
                    {review.content.split("\n").map((line, i) => {
                      if (line.startsWith("## ")) {
                        return <h2 key={i} className="text-base font-bold text-zinc-800 mt-5 mb-2">{line.slice(3)}</h2>;
                      }
                      if (line.startsWith("### ")) {
                        return <h3 key={i} className="text-sm font-semibold text-zinc-700 mt-4 mb-1">{line.slice(4)}</h3>;
                      }
                      if (line.startsWith("- ")) {
                        return <p key={i} className="text-sm pl-3 text-zinc-600">• {line.slice(2)}</p>;
                      }
                      if (line === "") {
                        return <div key={i} className="h-2" />;
                      }
                      return <p key={i} className="text-sm text-zinc-700">{line}</p>;
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


