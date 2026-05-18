import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "node:path";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: "file:" + path.resolve("prisma/dev.db") }),
});

const plans = JSON.parse(process.env.MONTHLY_PLANS_JSON ?? "[]");

let created = 0;
let updated = 0;
const missingGoals = [];

for (const item of plans) {
  const goal = await prisma.goal.findFirst({
    where: { year: 2026, title: item.goalTitle },
  });

  if (!goal) {
    missingGoals.push(item.goalTitle);
    continue;
  }

  const hasTitle = Boolean(item.title?.trim());
  const title = hasTitle ? item.title.trim() : `[실적] ${item.goalTitle}`;
  const resultMemo = item.resultMemo?.trim() || null;
  const data = {
    year: 2026,
    month: Number(item.month),
    title,
    description: hasTitle ? null : "계획 없이 실적 칸에서 가져온 항목",
    status: "ACTIVE",
    resultMemo,
    reviewedAt: resultMemo ? new Date() : null,
    goalId: goal.id,
  };

  const existing = await prisma.monthlyPlan.findFirst({
    where: {
      year: data.year,
      month: data.month,
      title: data.title,
      goalId: data.goalId,
    },
  });

  if (existing) {
    await prisma.monthlyPlan.update({ where: { id: existing.id }, data });
    updated++;
  } else {
    await prisma.monthlyPlan.create({ data });
    created++;
  }
}

const total2026MonthlyPlans = await prisma.monthlyPlan.count({
  where: { year: 2026 },
});

console.log(JSON.stringify({
  parsed: plans.length,
  created,
  updated,
  skippedMissingGoal: [...new Set(missingGoals)],
  total2026MonthlyPlans,
}, null, 2));

await prisma.$disconnect();
