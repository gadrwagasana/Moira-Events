import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin/session";
import { CLIENT_SESSION_COOKIE, verifyClientSessionToken } from "@/lib/client-portal/session";

// Admin and Client Portal are deliberately separate auth systems (Stage:
// Client Portal §2/§28) — each branch below checks only its own cookie, so
// an admin session can never grant portal access or vice versa. This is a
// UX convenience layer (redirect when clearly unauthenticated); the real
// authorization boundary is the data layer (lib/client-portal/data.ts),
// which re-derives identity from the session on every query.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!verifySessionToken(token)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/portal")) {
    const publicPortalRoutes = [
      "/portal/login",
      "/portal/activate",
      "/portal/register",
      "/portal/verify-email",
      "/portal/forgot-password",
      "/portal/reset-password",
    ];
    if (publicPortalRoutes.includes(pathname)) {
      return NextResponse.next();
    }
    const token = request.cookies.get(CLIENT_SESSION_COOKIE)?.value;
    if (!verifyClientSessionToken(token)) {
      return NextResponse.redirect(new URL("/portal/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
