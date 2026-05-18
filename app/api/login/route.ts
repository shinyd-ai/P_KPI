import { NextRequest, NextResponse } from "next/server";
import {
  createSessionCookieValue,
  getAppCredentials,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";

function safeNextPath(value: FormDataEntryValue | null) {
  const next = String(value ?? "/");

  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function POST(request: NextRequest) {
  const credentials = getAppCredentials();
  const formData = await request.formData();
  const nextPath = safeNextPath(formData.get("next"));

  if (!credentials) {
    return NextResponse.redirect(new URL("/login?error=config", request.url), {
      status: 303,
    });
  }

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (username !== credentials.username || password !== credentials.password) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url), {
      status: 303,
    });
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), {
    status: 303,
  });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: await createSessionCookieValue(),
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
