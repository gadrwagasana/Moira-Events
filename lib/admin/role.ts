import type { AdminRole } from "@/lib/generated/prisma/client";

// CMS Phase 1.4 — minimum-permission (rank-based) role comparison, fixing
// the exact-match bug in the original requireAdminRole(): with exact
// matching, requireAdminRole("EDITOR") would have denied an ADMIN too
// (since "ADMIN" !== "EDITOR"), even though ADMIN is meant to be able to do
// everything EDITOR can. Not yet exploitable — every current call site
// only ever requests "ADMIN" — but the API itself was ambiguous about which
// semantics it implemented, which this makes explicit and unambiguous.
//
// A plain Record<AdminRole, number>, not a database/Next.js import of any
// kind, so this file (and hasAtLeastRole specifically) can be unit-tested
// directly with zero database or request-context dependency — see
// scripts/verify-cms-phase1-security.ts. `AdminRole` itself is imported
// with `import type`, which TypeScript erases entirely at compile time, so
// even that import causes no runtime module load.
//
// ADMIN outranks EDITOR. If a third role is ever added above ADMIN, add it
// here with a higher number — every existing call to hasAtLeastRole/
// requireAdminRole keeps meaning exactly what it already says ("this role
// or higher") with no further changes needed at any call site.
const ADMIN_ROLE_RANK: Record<AdminRole, number> = {
  EDITOR: 0,
  ADMIN: 1,
};

/**
 * True if `actual` is at least as privileged as `minimum` in the role
 * hierarchy (ADMIN > EDITOR). This is minimum-permission semantics, not
 * exact-match: hasAtLeastRole("ADMIN", "EDITOR") is true, because an ADMIN
 * satisfies any check that only requires EDITOR-level access.
 */
export function hasAtLeastRole(actual: AdminRole, minimum: AdminRole): boolean {
  return ADMIN_ROLE_RANK[actual] >= ADMIN_ROLE_RANK[minimum];
}
