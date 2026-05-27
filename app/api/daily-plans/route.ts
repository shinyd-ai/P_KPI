import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: fetch daily plans for a date.
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

// POST: create daily plans, either one custom item or copied monthly plans.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Copy multiple monthly plans into a selected date.
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

    // Create one custom daily plan.
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

// PATCH: update daily plan fields for the selected date only.
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


    return NextResponse.json(plan);
  } catch (error) {
    console.error("PATCH /api/daily-plans error:", error);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

// DELETE: delete one daily plan.
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


