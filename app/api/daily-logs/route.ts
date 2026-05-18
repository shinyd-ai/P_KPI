import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const dateStr = searchParams.get("date");

  try {
    let dateFilter = {};

    if (dateStr) {
      const date = new Date(dateStr);
      dateFilter = { date };
    } else if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      dateFilter = { date: { gte: startDate, lte: endDate } };
    }

    const logs = await prisma.dailyLog.findMany({
      where: dateFilter,
      include: {
        goal: { select: { id: true, title: true } },
        monthlyPlan: { select: { id: true, title: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET /api/daily-logs error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, title, description, durationMinutes, alignmentType, monthlyPlanId, goalId } = body;

    if (!date || !title || !alignmentType) {
      return NextResponse.json(
        { error: "date, title, alignmentType are required" },
        { status: 400 }
      );
    }

    const log = await prisma.dailyLog.create({
      data: {
        date: new Date(date),
        title,
        description,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
        alignmentType,
        monthlyPlanId: monthlyPlanId || null,
        goalId: goalId || null,
      },
      include: {
        goal: { select: { id: true, title: true } },
        monthlyPlan: { select: { id: true, title: true } },
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("POST /api/daily-logs error:", error);
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await prisma.dailyLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/daily-logs error:", error);
    return NextResponse.json({ error: "Failed to delete log" }, { status: 500 });
  }
}


