import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { authConfig } from "@/server/auth/auth.config";

const { auth } = NextAuth(authConfig);

const authMiddleware = auth((req, _event: NextFetchEvent) => {
  void _event;
  const { pathname, search } = req.nextUrl;
  const isAuthenticated = Boolean(req.auth?.user?.id);

  // Allow public SEO, agentic discovery, and webmanifest endpoints without authentication
  if (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/llms.txt" ||
    pathname.startsWith("/.well-known/")
  ) {
    return NextResponse.next();
  }

  // Allow API route handlers outside /api/auth to enforce and format their own 401/403 JSON
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from /login back to dashboard root
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Protect all dashboard routes
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return authMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!api/auth|api/health|api/cron/deadline-alerts|_next/static|_next/image|brand/|placeholders/|favicon.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|llms\\.txt|\\.well-known/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|woff2?)$).*)",
  ],
};
