import { NextResponse, type NextRequest } from "next/server";

const REALM = "P-KPI2";

function unauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
    },
  });
}

function expectedAuthorizationHeader() {
  const username = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    return null;
  }

  return `Basic ${btoa(`${username}:${password}`)}`;
}

export function proxy(request: NextRequest) {
  const expected = expectedAuthorizationHeader();

  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      return new Response("Basic auth is not configured", { status: 503 });
    }

    return NextResponse.next();
  }

  if (request.headers.get("authorization") !== expected) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
