import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, isAuthConfigured, verifyAuthToken } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/api/login",
  "/api/notifications/discord/daily",
  "/icon.png",
  "/apple-icon.png",
  "/manifest.webmanifest",
];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/_next/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!isAuthConfigured() && process.env.NODE_ENV === "production") {
    return new Response("App auth is not configured", { status: 503 });
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = await verifyAuthToken(token);

  if (isAuthenticated) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
