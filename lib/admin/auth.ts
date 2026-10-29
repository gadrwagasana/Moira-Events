import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import type { AdminRole } from "@/lib/generated/prisma/client";
import { ADMIN_IDENTITY_SESSION_COOKIE, verifyAdminIdentityToken } from "./identity-session";
import { hasAtLeastRole } from "./role";

export type AuthenticatedAdmin = { id: string; email: string; role: AdminRole };

// CMS Phase 1 — complete and type-checks, but not called from anywhere yet
// (proxy.ts / app/admin/(dashboard)/layout.tsx / existing admin actions all
// still rely solely on the old shared-password lib/admin/session.ts). See
// SETUP.md ("CMS Phase 1") for the required cutover sequence, and the
// repository-wide grep invariant (checked before this phase was reported
// done) confirming nothing under app/ imports this file yet.
//
// Unlike lib/client-portal/auth.ts's getAuthenticatedClientId() — which
// never touches the database, since the signed cookie alone is the client
// portal's authorization boundary — this deliberately re-fetches the Admin
// row from the database on every call. The signed cookie here only proves
// "this is a request from whoever was issued this token at some point";
// role and active-status are looked up fresh every time, so disabling an
// account or changing its role takes effect on the very next request, not
// after the cookie's remaining 7-day lifetime. Wrapped in React's cache()
// (new pattern for this codebase) so multiple call sites on one request —
// a layout, a page, a nested component — cost one query, not one each.
export const getAuthenticatedAdmin = cache(async (): Promise<AuthenticatedAdmin | null> => {
  const store = await cookies();
  const token = store.get(ADMIN_IDENTITY_SESSION_COOKIE)?.value;
  const adminId = verifyAdminIdentityToken(token);
  if (!adminId) return null;

  // Called on every single admin request (every layout/page/action calls
  // requireAdminRole -> requireAuthenticatedAdmin), cached per-request by
  // React's cache() above but still one real query per request — wrapped
  // with retry so a transient connection blip here doesn't take down every
  // admin page at once.
  const admin = await withDbRetry(() =>
    prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, role: true, isActive: true },
    }),
  );
  if (!admin || !admin.isActive) return null;

  return { id: admin.id, email: admin.email, role: admin.role };
});

export async function requireAuthenticatedAdmin(): Promise<AuthenticatedAdmin> {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }
  return admin;
}

// Minimum-permission, not exact-match: requireAdminRole("EDITOR") allows
// BOTH an EDITOR and an ADMIN (ADMIN outranks EDITOR — see ./role.ts),
// while requireAdminRole("ADMIN") allows only an ADMIN, since nothing
// outranks it today. Every call site reads the same way regardless of
// which role it names: "this role, or anything above it." Redirects
// (never silently renders nothing) on denial, so a denied EDITOR sees they
// were sent somewhere, not a blank/broken page.
//
// The redirect target must be reachable by EVERY role, not just ADMIN —
// /admin/enquiries itself requires requireAdminRole("ADMIN"), so sending a
// denied EDITOR there was an infinite redirect loop (confirmed by reading
// app/admin/(dashboard)/enquiries/page.tsx's own role check, not assumed).
// /admin/cms requires only requireAdminRole("EDITOR") (the lowest rank), so
// both EDITOR and ADMIN land on a page they're actually allowed to see.
export async function requireAdminRole(minimumRole: AdminRole): Promise<AuthenticatedAdmin> {
  const admin = await requireAuthenticatedAdmin();
  if (!hasAtLeastRole(admin.role, minimumRole)) {
    redirect("/admin/cms");
  }
  return admin;
}
