import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_IDENTITY_SESSION_COOKIE, verifyAdminIdentityToken } from "@/lib/admin/identity-session";
import { CLIENT_SESSION_COOKIE, verifyClientSessionToken } from "@/lib/client-portal/session";

// Admin and Client Portal are deliberately separate auth systems (Stage:
// Client Portal §2/§28) — each branch below checks only its own cookie, so
// an admin session can never grant portal access or vice versa. This is a
// UX convenience layer (redirect when clearly unauthenticated); the real
// authorization boundary is the data layer, which re-derives identity (and,
// for admin, role/active-status from the database — see lib/admin/auth.ts)
// on every query/action, not just once here.
//
// CMS Phase 2: switched from the old shared-ADMIN_PASSWORD session
// (lib/admin/session.ts, ADMIN_SESSION_COOKIE) to the individual-admin
// identity session (lib/admin/identity-session.ts,
// ADMIN_IDENTITY_SESSION_COOKIE), as one coherent change together with
// app/admin/login/actions.ts (same cookie name/verifier on both sides, so
// there is no window where one issues a cookie the other rejects). The old
// cookie/module is no longer read or written anywhere — it is not kept as
// an alternate route into the dashboard. This check only verifies the
// token's signature and expiry (cheap, no database access, matching the
// client-portal pattern above) — it deliberately does NOT check role or
// whether the account is still active; that happens in
// lib/admin/auth.ts's getAuthenticatedAdmin(), which every protected
// page/Server Action calls and which re-reads the Admin row from the
// database every time. A disabled admin with an otherwise still-valid
// signed cookie passes this check but is rejected at that second,
// DB-backed layer.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }
    const token = request.cookies.get(ADMIN_IDENTITY_SESSION_COOKIE)?.value;
    if (!verifyAdminIdentityToken(token)) {
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
