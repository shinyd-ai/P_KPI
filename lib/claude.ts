import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ReviewStats {
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

interface GoalInfo {
  title: string;
  description?: string | null;
}

export async function generateMonthlyReview(
  year: number,
  month: number,
  stats: ReviewStats,
  goals: GoalInfo[]
): Promise<string> {
  const monthName = new Date(year, month - 1).toLocaleString("ko-KR", {
    month: "long",
  });

  const goalList = goals.map((g) => `- ${g.title}${g.description ? `: ${g.description}` : ""}`).join("\n");

  const prompt = `당신은 개인 성장 코치입니다. 다음 데이터를 바탕으로 ${year}년 ${monthName} 회고를 작성해주세요.

## 연간 목표
${goalList || "설정된 목표 없음"}

## ${year}년 ${monthName} 활동 통계
- 총 기록 수: ${stats.totalLogs}개
- 총 활동 시간: ${Math.floor(stats.totalMinutes / 60)}시간 ${stats.totalMinutes % 60}분
- 월간계획 연결: ${stats.monthlyLinked}개 (${stats.monthlyLinkedPct}%)
- 연간목표 연관: ${stats.goalAligned}개 (${stats.goalAlignedPct}%)
- 기타 활동: ${stats.unrelated}개 (${stats.unrelatedPct}%)

## 목표별 활동 분포
${Object.entries(stats.goalBreakdown).map(([goal, count]) => `- ${goal}: ${count}회`).join("\n") || "없음"}

## 월간계획별 활동 분포
${Object.entries(stats.planBreakdown).map(([plan, count]) => `- ${plan}: ${count}회`).join("\n") || "없음"}

다음 형식으로 회고를 작성해 주세요:

## ${year}년 ${monthName} 회고

### 이달의 성과
(이번 달 잘한 점, 달성한 것들을 구체적으로)

### 목표 달성도 분석
(연간 목표 대비 이번 달 활동이 얼마나 정렬되었는지)

### 개선할 점
(다음 달에 개선해야 할 사항)

### 다음 달 제안
(다음 달에 집중해야 할 것들)

### 한 줄 요약
(이번 달을 한 문장으로)`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude API");
  }

  return content.text;
}


