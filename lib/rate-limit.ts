import { headers } from "next/headers";

// In-memory, single-process rate limiting (Stage K.5 §27) — the only
// "simple implementation appropriate for the current deployment
// architecture" without adding Redis/a distributed store. Known production
// limitation, documented in SETUP.md: this resets on every server restart
// and does not hold across multiple instances/serverless cold starts.
const attempts = new Map<string, { count: number; windowStart: number }>();

export function checkRateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    attempts.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
