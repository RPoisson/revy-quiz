import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Ensure the cookie name matches the login route
const COOKIE_NAME = process.env.PASSWORD_COOKIE_NAME ?? "revy_quiz_auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that don't require access
  const publicPaths = ["/login", "/api/login", "/favicon.ico"];
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  // Next.js internals and static assets should always pass through
  if (
    isPublic ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // Read the same cookie the login route sets
  const accessCookie = req.cookies.get(COOKIE_NAME);

  // If logged in → allow access
  if (accessCookie?.value === "true") {
    return NextResponse.next();
  }

  // Otherwise redirect to login
  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: "/:path*",
};
