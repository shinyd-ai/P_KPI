import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const url = "file:" + path.resolve("prisma/dev.db");
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { name: "부동산", icon: "🏢", color: "#3B82F6", order: 1 },
  { name: "강의",   icon: "📚", color: "#F59E0B", order: 2 },
  { name: "주식",   icon: "📈", color: "#10B981", order: 3 },
  { name: "파이프라인", icon: "🔗", color: "#8B5CF6", order: 4 },
  { name: "모임",   icon: "🤝", color: "#06B6D4", order: 5 },
  { name: "독서",   icon: "📖", color: "#84CC16", order: 6 },
  { name: "AI",     icon: "🤖", color: "#F97316", order: 7 },
  { name: "회사",   icon: "🏬", color: "#EF4444", order: 8 },
  { name: "건강",   icon: "💪", color: "#EC4899", order: 9 },
  { name: "가족",   icon: "👨‍👩‍👧", color: "#6B7280", order: 10 },
];

// 목표 제목 키워드 → 카테고리 매핑
const KEYWORD_MAP: { keywords: string[]; category: string }[] = [
  { keywords: ["부동산", "경매", "아파트", "자산관리"], category: "부동산" },
  { keywords: ["강의", "수강생", "런칭", "커리큘럼"], category: "강의" },
  { keywords: ["주식", "ETF", "포트폴리오", "투자"], category: "주식" },
  { keywords: ["파이프라인", "자동화", "수익형", "사이트"], category: "파이프라인" },
  { keywords: ["모임", "네트워킹", "멘토"], category: "모임" },
  { keywords: ["독서", "독서 노트", "책"], category: "독서" },
  { keywords: ["AI", "에이전트", "ai"], category: "AI" },
  { keywords: ["매출", "클라이언트", "팀", "회사"], category: "회사" },
  { keywords: ["건강", "체중", "운동", "kg"], category: "건강" },
  { keywords: ["가족", "여행", "부모님", "용돈"], category: "가족" },
];

async function main() {
  console.log("🌱 Seeding categories...");

  // 카테고리 생성 (이미 있으면 스킵)
  const catMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (existing) {
      catMap[cat.name] = existing.id;
      console.log(`  ✓ 이미 존재: ${cat.icon} ${cat.name}`);
    } else {
      const created = await prisma.category.create({ data: cat });
      catMap[cat.name] = created.id;
      console.log(`  + 생성: ${cat.icon} ${cat.name}`);
    }
  }

  // 기존 목표에 카테고리 자동 배정
  console.log("\n🎯 Assigning categories to goals...");
  const goals = await prisma.goal.findMany({ where: { categoryId: null } });
  let assigned = 0;

  for (const goal of goals) {
    const lowerTitle = goal.title.toLowerCase();
    let matched: string | null = null;

    for (const { keywords, category } of KEYWORD_MAP) {
      if (keywords.some((k) => lowerTitle.includes(k.toLowerCase()))) {
        matched = category;
        break;
      }
    }

    if (matched && catMap[matched]) {
      await prisma.goal.update({
        where: { id: goal.id },
        data: { categoryId: catMap[matched] },
      });
      console.log(`  ✓ "${goal.title}" → ${matched}`);
      assigned++;
    } else {
      console.log(`  ? "${goal.title}" → 미분류 (수동 배정 필요)`);
    }
  }

  console.log(`\n✅ 완료: 카테고리 ${CATEGORIES.length}개, 목표 ${assigned}/${goals.length}개 배정`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());


