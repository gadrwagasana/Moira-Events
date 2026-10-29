import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_IDENTITY_SESSION_COOKIE = "admin_identity_session";
export const ADMIN_IDENTITY_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// CMS Phase 1 — a NEW, separate cookie/secret from the existing
// lib/admin/session.ts, which keeps running the old shared-ADMIN_PASSWORD
// flow unchanged. This module is complete and type-checks but nothing
// currently sets or reads ADMIN_IDENTITY_SESSION_COOKIE — see SETUP.md
// ("CMS Phase 1") for the cutover sequence that eventually retires the old
// module in favor of this one.
//
// Deliberately its own secret (ADMIN_IDENTITY_SESSION_SECRET), not a reuse
// of ADMIN_SESSION_SECRET — this project's established convention (see
// lib/client-portal/session.ts's identical comment re: CLIENT_SESSION_SECRET
// vs ADMIN_SESSION_SECRET) is one secret per auth system, specifically so
// cross-system/cross-version token confusion is structurally impossible,
// not just incidentally unlikely.
//
// The payload deliberately carries ONLY the admin's id, never role or
// active-status — those are looked up fresh from the database on every
// call (lib/admin/auth.ts), so disabling an account or changing its role
// takes effect immediately rather than waiting out this cookie's own
// 7-day lifetime. Baking role into a signed token would be a second,
// stale source of truth that could silently diverge from the database.
function sign(payload: string): string {
  const secret = process.env.ADMIN_IDENTITY_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_IDENTITY_SESSION_SECRET is not set");
  }
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createAdminIdentityToken(adminId: string): string {
  const expiresAt = Date.now() + ADMIN_IDENTITY_SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${adminId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminIdentityToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [adminId, expiresAtRaw, signature] = parts;
  if (!adminId || !expiresAtRaw || !signature) return null;

  const payload = `${adminId}.${expiresAtRaw}`;

  let expectedBuf: Buffer;
  let actualBuf: Buffer;
  try {
    expectedBuf = Buffer.from(sign(payload), "hex");
    actualBuf = Buffer.from(signature, "hex");
  } catch {
    return null;
  }
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return null;

  return adminId;
}
