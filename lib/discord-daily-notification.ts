import { prisma } from "@/lib/prisma";

const DEFAULT_TIME_ZONE = "Asia/Seoul";
const MAX_LISTED_PLANS = 6;

type DailyPlanForNotification = {
  id: string;
  title: string;
  completed: boolean;
  monthlyPlan: { title: string } | null;
  goal: { title: string } | null;
};

export type DiscordDailyNotificationPayload = {
  content: string;
  allowed_mentions: { parse: string[] };
};

export type DiscordDailyNotificationSummary = {
  date: string;
  totalPlans: number;
  completedPlans: number;
  incompletePlans: number;
  listedIncompletePlans: string[];
  appUrl: string;
};

function getTodayDateString(timeZone = DEFAULT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return new Date().toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function getAppUrl() {
  return (process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

function getPlanContext(plan: DailyPlanForNotification) {
  if (plan.monthlyPlan?.title) {
    return ` - ${plan.monthlyPlan.title}`;
  }

  if (plan.goal?.title) {
    return ` - ${plan.goal.title}`;
  }

  return "";
}

function formatMessage(summary: DiscordDailyNotificationSummary) {
  const lines = [
    `[오늘 KPI 체크] ${summary.date}`,
    `완료: ${summary.completedPlans}/${summary.totalPlans}`,
  ];

  if (summary.totalPlans === 0) {
    lines.push("오늘 등록된 계획이 없습니다. 먼저 오늘 할 일을 잡아두세요.");
  } else if (summary.incompletePlans === 0) {
    lines.push("미완료 항목이 없습니다. 오늘 체크는 끝났습니다.");
  } else {
    lines.push(`미완료: ${summary.incompletePlans}개`);
    lines.push("");
    lines.push(
      ...summary.listedIncompletePlans.map((title) => `- ${title}`)
    );
  }

  if (summary.appUrl) {
    lines.push("");
    lines.push(`확인하기: ${summary.appUrl}/daily`);
  }

  return lines.join("\n");
}

export async function buildDiscordDailyNotification() {
  const timeZone = process.env.DISCORD_NOTIFICATION_TIME_ZONE ?? DEFAULT_TIME_ZONE;
  const date = getTodayDateString(timeZone);

  const plans = await prisma.dailyPlan.findMany({
    include: {
      monthlyPlan: { select: { title: true } },
      goal: { select: { title: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const todayPlans = plans.filter((plan) => {
    const planDate = new Date(plan.date).toISOString().slice(0, 10);
    return planDate === date;
  });

  const incomplete = todayPlans.filter((plan) => !plan.completed);
  const listedIncompletePlans = incomplete
    .slice(0, MAX_LISTED_PLANS)
    .map((plan) => `${plan.title}${getPlanContext(plan)}`);

  if (incomplete.length > MAX_LISTED_PLANS) {
    listedIncompletePlans.push(`외 ${incomplete.length - MAX_LISTED_PLANS}개`);
  }

  const summary: DiscordDailyNotificationSummary = {
    date,
    totalPlans: todayPlans.length,
    completedPlans: todayPlans.length - incomplete.length,
    incompletePlans: incomplete.length,
    listedIncompletePlans,
    appUrl: getAppUrl(),
  };

  const payload: DiscordDailyNotificationPayload = {
    content: formatMessage(summary),
    allowed_mentions: { parse: [] },
  };

  return { payload, summary };
}

export async function sendDiscordDailyNotification(
  payload: DiscordDailyNotificationPayload
) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      ok: false,
      status: 500,
      error: "DISCORD_WEBHOOK_URL is not configured",
    };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      ok: false,
      status: response.status,
      error: errorText.slice(0, 300) || "Discord webhook request failed",
    };
  }

  return { ok: true, status: response.status };
}
