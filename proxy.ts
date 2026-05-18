import { NextResponse, type NextRequest } from "next/server";
import {
  getAppCredentials,
  getSessionSecret,
  SESSION_COOKIE_NAME,
  verifySessionCookieValue,
} from "@/lib/session";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/login") {
    return NextResponse.next();
  }

  if (!getAppCredentials() || !getSessionSecret()) {
    if (process.env.NODE_ENV === "production") {
      return new Response("Login is not configured", { status: 503 });
    }

    return NextResponse.next();
  }

  const isLoggedIn = await verifySessionCookieValue(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  if (isLoggedIn) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|login|logout).*)",
  ],
};
