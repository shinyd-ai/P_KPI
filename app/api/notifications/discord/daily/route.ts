import { NextRequest, NextResponse } from "next/server";
import {
  buildDiscordDailyNotification,
  sendDiscordDailyNotification,
} from "@/lib/discord-daily-notification";

export const dynamic = "force-dynamic";

function getProvidedSecret(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
}

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return getProvidedSecret(request) === cronSecret;
}

async function handleDailyDiscordNotification(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const notification = await buildDiscordDailyNotification();

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      sent: false,
      ...notification,
    });
  }

  const result = await sendDiscordDailyNotification(notification.payload);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, summary: notification.summary },
      { status: result.status }
    );
  }

  return NextResponse.json({
    sent: true,
    status: result.status,
    summary: notification.summary,
  });
}

export async function GET(request: NextRequest) {
  return handleDailyDiscordNotification(request);
}

export async function POST(request: NextRequest) {
  return handleDailyDiscordNotification(request);
}
