import { createHmac, timingSafeEqual } from "crypto";

export const CLIENT_SESSION_COOKIE = "client_session";
export const CLIENT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

// Deliberately a separate secret from ADMIN_SESSION_SECRET (Stage: Client
// Portal §2) — an admin session token must never verify as a valid client
// session, and vice versa.
function sign(payload: string): string {
  const secret = process.env.CLIENT_SESSION_SECRET;
  if (!secret) {
    throw new Error("CLIENT_SESSION_SECRET is not set");
  }
  return createHmac("sha256", secret).update(payload).digest("hex");
}

// Stateless signed cookie, same pattern as lib/admin/session.ts, but the
// payload carries the clientId (not just an expiry) since there are many
// clients, not one shared admin password.
export function createClientSessionToken(clientId: string): string {
  const expiresAt = Date.now() + CLIENT_SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${clientId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyClientSessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [clientId, expiresAtRaw, signature] = parts;
  if (!clientId || !expiresAtRaw || !signature) return null;

  const payload = `${clientId}.${expiresAtRaw}`;

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

  return clientId;
}
