import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        monthlyPlans: { orderBy: [{ year: "desc" }, { month: "desc" }] },
        dailyLogs: { orderBy: { date: "desc" }, take: 20 },
      },
    });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    return NextResponse.json(goal);
  } catch (error) {
    console.error("GET /api/goals/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch goal" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { title, description, status, categoryId } = body;

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(categoryId !== undefined && { categoryId: categoryId ?? null }),
      },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
    return NextResponse.json(goal);
  } catch (error) {
    console.error("PATCH /api/goals/[id] error:", error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/goals/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}


