import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const defaultContent = {
  summary: "",
  lessons: "",
  risks: "",
  mood: "",
  blogOpening: "",
};

function parseContent(content: string) {
  try {
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return defaultContent;
    }
    return { ...defaultContent, ...parsed };
  } catch {
    return defaultContent;
  }
}

function normalizeMonthParams(year: string, month: string) {
  const parsedYear = parseInt(year, 10);
  const parsedMonth = parseInt(month, 10);

  if (!Number.isInteger(parsedYear) || !Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    return null;
  }

  return { year: parsedYear, month: parsedMonth };
}

async function ensureRetrospectiveTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "MonthlyRetrospective" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "year" INTEGER NOT NULL,
      "month" INTEGER NOT NULL,
      "content" TEXT NOT NULL DEFAULT '{}',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyRetrospective_year_month_key"
    ON "MonthlyRetrospective"("year", "month")
  `);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  const { year: yearStr, month: monthStr } = await params;
  const normalized = normalizeMonthParams(yearStr, monthStr);

  if (!normalized) {
    return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
  }

  try {
    await ensureRetrospectiveTable();

    const retrospective = await prisma.monthlyRetrospective.findUnique({
      where: { year_month: normalized },
    });

    if (!retrospective) {
      return NextResponse.json({
        ...normalized,
        content: defaultContent,
        createdAt: null,
        updatedAt: null,
      });
    }

    return NextResponse.json({
      ...retrospective,
      content: parseContent(retrospective.content),
    });
  } catch (error) {
    console.error("GET /api/retrospectives error:", error);
    return NextResponse.json({ error: "Failed to fetch retrospective" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  const { year: yearStr, month: monthStr } = await params;
  const normalized = normalizeMonthParams(yearStr, monthStr);

  if (!normalized) {
    return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
  }

  try {
    await ensureRetrospectiveTable();

    const body = await request.json();
    const content = {
      summary: typeof body.summary === "string" ? body.summary : "",
      lessons: typeof body.lessons === "string" ? body.lessons : "",
      risks: typeof body.risks === "string" ? body.risks : "",
      mood: typeof body.mood === "string" ? body.mood : "",
      blogOpening: typeof body.blogOpening === "string" ? body.blogOpening : "",
    };

    const retrospective = await prisma.monthlyRetrospective.upsert({
      where: { year_month: normalized },
      create: {
        ...normalized,
        content: JSON.stringify(content),
      },
      update: {
        content: JSON.stringify(content),
      },
    });

    return NextResponse.json({
      ...retrospective,
      content,
    });
  } catch (error) {
    console.error("PUT /api/retrospectives error:", error);
    return NextResponse.json({ error: "Failed to save retrospective" }, { status: 500 });
  }
}
