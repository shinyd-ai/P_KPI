import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { goals: true } } },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, icon, color, order } = await request.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const maxOrder = await prisma.category.aggregate({ _max: { order: true } });
    const category = await prisma.category.create({
      data: {
        name,
        icon: icon ?? "📌",
        color: color ?? "#6B7280",
        order: order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, name, icon, color, order } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(order !== undefined && { order }),
      },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error("PATCH /api/categories error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  try {
    // 해당 카테고리의 목표들은 category 미연결로 변경
    await prisma.goal.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/categories error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}


