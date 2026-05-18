import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  try {
    const plans = await prisma.monthlyPlan.findMany({
      where: {
        ...(year && { year: parseInt(year) }),
        ...(month && { month: parseInt(month) }),
      },
      include: {
        goal: { select: { id: true, title: true, category: { select: { id: true, name: true, icon: true, color: true } } } },
        _count: { select: { dailyLogs: true } },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("GET /api/monthly-plans error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month, title, description, goalId, status, resultMemo } = body;

    if (!year || !month || !title) {
      return NextResponse.json({ error: "year, month, title are required" }, { status: 400 });
    }

    const plan = await prisma.monthlyPlan.create({
      data: {
        year: parseInt(year),
        month: parseInt(month),
        title,
        description,
        ...(status !== undefined && { status }),
        resultMemo: resultMemo || null,
        reviewedAt: resultMemo ? new Date() : null,
        goalId: goalId || null,
      },
      include: { goal: { select: { id: true, title: true } } },
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("POST /api/monthly-plans error:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, status, goalId, resultMemo } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const plan = await prisma.monthlyPlan.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(resultMemo !== undefined && {
          resultMemo: resultMemo || null,
          reviewedAt: resultMemo ? new Date() : null,
        }),
        ...(goalId !== undefined && { goalId: goalId || null }),
      },
      include: { goal: { select: { id: true, title: true } } },
    });
    return NextResponse.json(plan);
  } catch (error) {
    console.error("PATCH /api/monthly-plans error:", error);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await prisma.monthlyPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/monthly-plans error:", error);
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 });
  }
}


