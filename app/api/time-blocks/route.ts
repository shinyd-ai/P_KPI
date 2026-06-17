import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = new Set(["PLANNED", "DONE", "MOVED", "CANCELED"]);

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function toDateString(value: Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function normalizeMinutes(value: unknown) {
  const parsed = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 24 * 60) return null;
  return parsed;
}

function normalizeStatus(value: unknown) {
  const status = typeof value === "string" ? value.toUpperCase() : "PLANNED";
  return VALID_STATUSES.has(status) ? status : null;
}

async function ensureTimeBlockTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TimeBlock" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "date" DATETIME NOT NULL,
      "title" TEXT NOT NULL,
      "startMinutes" INTEGER NOT NULL,
      "endMinutes" INTEGER NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PLANNED',
      "note" TEXT,
      "actualMinutes" INTEGER,
      "dailyPlanId" TEXT,
      "monthlyPlanId" TEXT,
      "goalId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "TimeBlock_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "DailyPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "TimeBlock_monthlyPlanId_fkey" FOREIGN KEY ("monthlyPlanId") REFERENCES "MonthlyPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "TimeBlock_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TimeBlock_date_idx" ON "TimeBlock"("date")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TimeBlock_dailyPlanId_idx" ON "TimeBlock"("dailyPlanId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TimeBlock_monthlyPlanId_idx" ON "TimeBlock"("monthlyPlanId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TimeBlock_goalId_idx" ON "TimeBlock"("goalId")`);
}

const includeRelations = {
  dailyPlan: {
    select: {
      id: true,
      date: true,
      title: true,
      completed: true,
      estimatedMinutes: true,
      actualMinutes: true,
      monthlyPlan: { select: { id: true, title: true } },
      goal: { select: { id: true, title: true, category: { select: { id: true, name: true, color: true, icon: true } } } },
    },
  },
  monthlyPlan: { select: { id: true, title: true } },
  goal: { select: { id: true, title: true, category: { select: { id: true, name: true, color: true, icon: true } } } },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");

  if (!startDate) {
    return NextResponse.json({ error: "startDate is required" }, { status: 400 });
  }

  const weekDates: string[] = [];
  const start = toDateOnly(startDate);
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    weekDates.push(toDateString(date));
  }
  const endDate = weekDates[6];

  try {
    await ensureTimeBlockTable();

    const [allBlocks, allPlans] = await Promise.all([
      prisma.timeBlock.findMany({
        include: includeRelations,
        orderBy: [{ date: "asc" }, { startMinutes: "asc" }],
      }),
      prisma.dailyPlan.findMany({
        include: {
          monthlyPlan: { select: { id: true, title: true } },
          goal: { select: { id: true, title: true, category: { select: { id: true, name: true, color: true, icon: true } } } },
          timeBlocks: { select: { id: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const timeBlocks = allBlocks.filter((block) => {
      const date = toDateString(block.date);
      return date >= startDate && date <= endDate;
    });

    const dailyPlans = allPlans.filter((plan) => {
      const date = toDateString(plan.date);
      return date >= startDate && date <= endDate;
    });

    const unplacedPlans = dailyPlans.filter((plan) => plan.timeBlocks.length === 0);

    return NextResponse.json({
      startDate,
      endDate,
      weekDates,
      timeBlocks,
      unplacedPlans,
    });
  } catch (error) {
    console.error("GET /api/time-blocks error:", error);
    return NextResponse.json({ error: "Failed to fetch time blocks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTimeBlockTable();

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const date = typeof body.date === "string" ? body.date : "";
    const startMinutes = normalizeMinutes(body.startMinutes);
    const endMinutes = normalizeMinutes(body.endMinutes);
    const status = normalizeStatus(body.status);

    if (!title || !date || startMinutes == null || endMinutes == null || !status) {
      return NextResponse.json({ error: "title, date, startMinutes, endMinutes, and status are required" }, { status: 400 });
    }

    if (endMinutes <= startMinutes) {
      return NextResponse.json({ error: "endMinutes must be greater than startMinutes" }, { status: 400 });
    }

    const dailyPlanId = typeof body.dailyPlanId === "string" && body.dailyPlanId ? body.dailyPlanId : null;
    let linkedPlan:
      | {
          id: string;
          title: string;
          monthlyPlanId: string | null;
          goalId: string | null;
          estimatedMinutes: number | null;
        }
      | null = null;

    if (dailyPlanId) {
      linkedPlan = await prisma.dailyPlan.findUnique({
        where: { id: dailyPlanId },
        select: { id: true, title: true, monthlyPlanId: true, goalId: true, estimatedMinutes: true },
      });
    }

    const actualMinutes = body.actualMinutes === "" || body.actualMinutes == null ? null : normalizeMinutes(body.actualMinutes);

    const block = await prisma.timeBlock.create({
      data: {
        date: toDateOnly(date),
        title,
        startMinutes,
        endMinutes,
        status,
        note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null,
        actualMinutes,
        dailyPlanId,
        monthlyPlanId: linkedPlan?.monthlyPlanId ?? (typeof body.monthlyPlanId === "string" && body.monthlyPlanId ? body.monthlyPlanId : null),
        goalId: linkedPlan?.goalId ?? (typeof body.goalId === "string" && body.goalId ? body.goalId : null),
      },
      include: includeRelations,
    });

    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error("POST /api/time-blocks error:", error);
    return NextResponse.json({ error: "Failed to create time block" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureTimeBlockTable();

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
      data.title = title;
    }
    if (body.date !== undefined) data.date = toDateOnly(String(body.date));
    if (body.startMinutes !== undefined) {
      const startMinutes = normalizeMinutes(body.startMinutes);
      if (startMinutes == null) return NextResponse.json({ error: "Invalid startMinutes" }, { status: 400 });
      data.startMinutes = startMinutes;
    }
    if (body.endMinutes !== undefined) {
      const endMinutes = normalizeMinutes(body.endMinutes);
      if (endMinutes == null) return NextResponse.json({ error: "Invalid endMinutes" }, { status: 400 });
      data.endMinutes = endMinutes;
    }
    if (body.status !== undefined) {
      const status = normalizeStatus(body.status);
      if (!status) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      data.status = status;
    }
    if (body.note !== undefined) data.note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;
    if (body.actualMinutes !== undefined) {
      data.actualMinutes = body.actualMinutes === "" || body.actualMinutes == null ? null : normalizeMinutes(body.actualMinutes);
    }

    const candidateStart = data.startMinutes as number | undefined;
    const candidateEnd = data.endMinutes as number | undefined;
    if (candidateStart !== undefined || candidateEnd !== undefined) {
      const current = await prisma.timeBlock.findUnique({ where: { id }, select: { startMinutes: true, endMinutes: true } });
      if (!current) return NextResponse.json({ error: "Time block not found" }, { status: 404 });
      const startMinutes = candidateStart ?? current.startMinutes;
      const endMinutes = candidateEnd ?? current.endMinutes;
      if (endMinutes <= startMinutes) {
        return NextResponse.json({ error: "endMinutes must be greater than startMinutes" }, { status: 400 });
      }
    }

    const block = await prisma.timeBlock.update({
      where: { id },
      data,
      include: includeRelations,
    });

    return NextResponse.json(block);
  } catch (error) {
    console.error("PATCH /api/time-blocks error:", error);
    return NextResponse.json({ error: "Failed to update time block" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await ensureTimeBlockTable();
    await prisma.timeBlock.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/time-blocks error:", error);
    return NextResponse.json({ error: "Failed to delete time block" }, { status: 500 });
  }
}
