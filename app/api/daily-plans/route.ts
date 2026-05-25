import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 날짜별 일간 계획 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  try {
    const allPlans = await prisma.dailyPlan.findMany({
      include: {
        monthlyPlan: { select: { id: true, title: true } },
        goal: { select: { id: true, title: true, category: { select: { id: true, name: true, icon: true, color: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Filter by date string in JS to avoid LibSQL DateTime range query issues
    const plans = allPlans.filter((p) => {
      const planDate = new Date(p.date).toISOString().slice(0, 10);
      return planDate === date;
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("GET /api/daily-plans error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

// POST: 일간 계획 생성 (단건 또는 월간계획에서 복수 가져오기)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 월간계획 여러 개를 한 번에 가져오는 경우
    if (body.fromMonthlyPlanIds && Array.isArray(body.fromMonthlyPlanIds)) {
      const { date, fromMonthlyPlanIds } = body;
      const targetDate = new Date(date + "T00:00:00.000Z");

      const monthlyPlans = await prisma.monthlyPlan.findMany({
        where: { id: { in: fromMonthlyPlanIds } },
        include: { goal: { select: { id: true } } },
      });

      const created = await Promise.all(
        monthlyPlans.map((mp) =>
          prisma.dailyPlan.create({
            data: {
              date: targetDate,
              title: mp.title,
              monthlyPlanId: mp.id,
              goalId: mp.goalId ?? null,
            },
            include: {
              monthlyPlan: { select: { id: true, title: true } },
              goal: { select: { id: true, title: true, category: { select: { id: true, name: true, icon: true, color: true } } } },
            },
          })
        )
      );
      return NextResponse.json(created, { status: 201 });
    }

    // 단건 추가
    const { date, title, monthlyPlanId, goalId, estimatedMinutes } = body;
    if (!date || !title) {
      return NextResponse.json({ error: "date and title are required" }, { status: 400 });
    }

    const plan = await prisma.dailyPlan.create({
      data: {
        date: new Date(date + "T00:00:00.000Z"),
        title,
        monthlyPlanId: monthlyPlanId || null,
        goalId: goalId || null,
        estimatedMinutes: estimatedMinutes != null ? parseInt(estimatedMinutes) : null,
      },
      include: {
        monthlyPlan: { select: { id: true, title: true } },
        goal: { select: { id: true, title: true } },
      },
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("POST /api/daily-plans error:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}

// PATCH: 완료 체크 / 메모 / 내일 넘기기
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, completed, note, rolledOver, estimatedMinutes, actualMinutes } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (completed !== undefined) {
      data.completed = completed;
      data.completedAt = completed ? new Date() : null;
    }
    if (note !== undefined) data.note = note;
    if (rolledOver !== undefined) data.rolledOver = rolledOver;
    if (estimatedMinutes !== undefined) data.estimatedMinutes = estimatedMinutes;
    if (actualMinutes !== undefined) data.actualMinutes = actualMinutes;

    const plan = await prisma.dailyPlan.update({
      where: { id },
      data,
      include: {
        monthlyPlan: { select: { id: true, title: true } },
        goal: { select: { id: true, title: true } },
      },
    });

    // 월간계획 상태 자동화: completed 변경 시 monthlyPlanId가 있으면 완료율 재계산
    if (completed !== undefined && plan.monthlyPlanId) {
      const monthlyPlanId = plan.monthlyPlanId;

      // 현재 월간계획 status 확인
      const monthlyPlan = await prisma.monthlyPlan.findUnique({
        where: { id: monthlyPlanId },
        select: { status: true },
      });

      // DROPPED 상태이면 변경하지 않음
      if (monthlyPlan && monthlyPlan.status !== "DROPPED") {
        // 해당 월간계획에 연결된 롤오버되지 않은 일간계획 전체 조회
        const linkedPlans = await prisma.dailyPlan.findMany({
          where: { monthlyPlanId, rolledOver: false },
          select: { completed: true },
        });

        const total = linkedPlans.length;
        const completedCount = linkedPlans.filter((p) => p.completed).length;

        let newStatus: string;
        if (total === 0) {
          newStatus = "ACTIVE";
        } else {
          const rate = (completedCount / total) * 100;
          if (rate === 100) {
            newStatus = "COMPLETED";
          } else if (rate >= 1) {
            newStatus = "PARTIAL";
          } else {
            newStatus = "ACTIVE";
          }
        }

        await prisma.monthlyPlan.update({
          where: { id: monthlyPlanId },
          data: { status: newStatus },
        });
      }
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("PATCH /api/daily-plans error:", error);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

// DELETE: 일간 계획 삭제
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await prisma.dailyPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/daily-plans error:", error);
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 });
  }
}


