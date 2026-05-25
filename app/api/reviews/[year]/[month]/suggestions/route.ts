import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNextMonthPlanSuggestions } from "@/lib/claude";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  if (isNaN(year) || isNaN(month)) {
    return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
  }

  try {
    // 해당 연월 회고 조회
    const review = await prisma.monthlyReview.findUnique({
      where: { year_month: { year, month } },
    });

    if (!review) {
      return NextResponse.json({ error: "회고가 없습니다" }, { status: 400 });
    }

    // 해당 연도의 ACTIVE/COMPLETED 목표 조회
    const goals = await prisma.goal.findMany({
      where: {
        year,
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
      select: { id: true, title: true, status: true },
    });

    // 다음 달 계획 추천 생성
    const suggestions = await generateNextMonthPlanSuggestions({
      reviewContent: review.content,
      currentYear: year,
      currentMonth: month,
      goals,
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("GET /api/reviews/[year]/[month]/suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
