import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "node:path";

const url = "file:" + path.resolve("prisma/dev.db");
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: "부동산", icon: "🎪", color: "#3B82F6", order: 1 },
  { name: "강의", icon: "📊", color: "#F59E0B", order: 2 },
  { name: "주식", icon: "📈", color: "#10B981", order: 3 },
  { name: "파이프라인", icon: "💰", color: "#8B5CF6", order: 4 },
  { name: "모임", icon: "👥", color: "#06B6D4", order: 5 },
  { name: "독서", icon: "📖", color: "#84CC16", order: 6 },
  { name: "AI", icon: "🧠", color: "#F97316", order: 7 },
  { name: "회사", icon: "🏬", color: "#EF4444", order: 8 },
  { name: "건강", icon: "🥋", color: "#EC4899", order: 9 },
  { name: "가족", icon: "👨‍👩‍👧‍👦", color: "#6B7280", order: 10 },
];

const goals = [
  { category: "부동산", title: "전세2건 마무리", description: "상반기목표: 구미 전세 재계약\n하반기목표: 1개 전세 재계약" },
  { category: "부동산", title: "이익난거 매도하기", description: "상반기목표: 수익률 정해서 매도 계획\n추이 확인하기\n하반기목표: 수익률 정해서 매도 계획\n추이 확인하기" },
  { category: "강의", title: "AI 강의", description: "상반기목표: 강의 1개\n하반기목표: 강의 1개" },
  { category: "강의", title: "흥부 재개발재건축 강의", description: "상반기목표: 강의 듣기\n하반기목표: 부동산 책 보고 정리" },
  { category: "강의", title: "부동산 대부들 블로그 보고 인사이트 얻기", description: "상반기목표: 숙주나물, 부룡 등등 보고\n블로그 작성 주 1회\n하반기목표: 숙주나물, 부룡 등등 보고\n블로그 작성 주 1회\n3분기: 12회\n4분기: 12회" },
  { category: "강의", title: "서재형 담샘 강의" },
  { category: "주식", title: "Class101 주식 강의 하나 듣기" },
  { category: "주식", title: "마연굴 포트폴리오 운영" },
  { category: "주식", title: "민재 주식 공유한거 분석하기" },
  { category: "주식", title: "서재형담샘 분석 및 마인드 장착하기" },
  { category: "주식", title: "한경유튜브 및 신문 매일 읽기" },
  { category: "파이프라인", title: "온라인 유통 사업 월 1천 매출", description: "상반기목표: 월 1천 매출\n하반기목표: 월 2천 매출" },
  { category: "파이프라인", title: "에어비앤비에서 부가적인 사업 아이템 발굴" },
  { category: "파이프라인", title: "에비 1개더?" },
  { category: "모임", title: "한가해보이님독서모임" },
  { category: "모임", title: "매너남독서모임" },
  { category: "모임", title: "부독모독서모임" },
  { category: "모임", title: "머니메이커스독서모임" },
  { category: "모임", title: "위브즈 투자모임" },
  { category: "모임", title: "66챌 투자모임" },
  { category: "모임", title: "부추 투자모임" },
  { category: "독서", title: "최소 월 1권 이상 읽기", description: "상반기목표: 12권\n1분기: 6권\n하반기목표: 12권\n3분기: 6권\n4분기: 6권" },
  { category: "독서", title: "연 30권 목표", description: "상반기목표: 15권\n1분기: 7권\n하반기목표: 15권\n3분기: 7권\n4분기: 8권" },
  { category: "독서", title: "12개의 이상 실행 목록 만들고 달성", description: "상반기목표: 15개 실행 완료\n1분기: 7개\n하반기목표: 15개 실행 완료\n3분기: 7개\n4분기: 8개" },
  { category: "AI", title: "AI 프로그램 개발" },
  { category: "AI", title: "AI 프로그램으로 수익화 하기" },
  { category: "AI", title: "AI 강의 하기" },
  { category: "회사", title: "나한테 맞는 자격증 있는지 확인" },
  { category: "회사", title: "회사레버리지", description: "상반기목표: 매달 최소 1개 이상 강의 듣기" },
  { category: "건강", title: "운동 주 4회" },
  { category: "건강", title: "근육량 35kg, 체지방율 12%", description: "상반기목표: 근육량 34kg\n체지방율 14%\n1분기: 근육량 33kg\n체지방율 15%" },
  { category: "건강", title: "와이프 운동 등록 3월" },
  { category: "가족", title: "부모님과 연 2회 여행", description: "상반기목표: 상반기 1회?" },
  { category: "가족", title: "우리가족 연 4회 여행", description: "상반기목표: 상반기 2회" },
];

async function main() {
  const categoryIds = new Map();

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { name: category.name },
      update: {
        icon: category.icon,
        color: category.color,
        order: category.order,
      },
      create: category,
    });
    categoryIds.set(category.name, saved.id);
  }

  let created = 0;
  let updated = 0;

  for (const goal of goals) {
    const existing = await prisma.goal.findFirst({
      where: {
        year: 2026,
        title: goal.title,
      },
    });

    const data = {
      year: 2026,
      title: goal.title,
      description: goal.description ?? null,
      status: "ACTIVE",
      categoryId: categoryIds.get(goal.category) ?? null,
    };

    if (existing) {
      await prisma.goal.update({
        where: { id: existing.id },
        data,
      });
      updated++;
    } else {
      await prisma.goal.create({ data });
      created++;
    }
  }

  console.log(`Imported 2026 goals: ${created} created, ${updated} updated.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
