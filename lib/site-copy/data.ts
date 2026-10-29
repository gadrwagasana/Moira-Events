// Read-side data access for SiteCopy — no auth check of its own (matches
// lib/site-images/data.ts's established convention), except the public
// helper is additionally safe to call from a public route because it only
// ever returns the override `value` string (or null) for a fixed, known
// key — never an internal/administrative field, never a draft state.
import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { SITE_COPY_KEYS, type SiteCopyKey } from "./keys";

// Public read — every fixed key mapped to its override, or null when none
// is saved (the caller applies its own `?? default` fallback, exactly like
// getAllSiteImageSlots's callers do for images).
export async function getSiteCopy(): Promise<Record<SiteCopyKey, string | null>> {
  const rows = await withDbRetry(() =>
    prisma.siteCopy.findMany({ where: { key: { in: SITE_COPY_KEYS } } }),
  );
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const result = {} as Record<SiteCopyKey, string | null>;
  for (const key of SITE_COPY_KEYS) {
    const value = byKey.get(key);
    result[key] = value && value.trim().length > 0 ? value : null;
  }
  return result;
}

// Admin "Site Copy" screen — every fixed key, including ones never set, so
// the editor can see (and fill) the complete list, plus who last touched
// each one.
export async function listSiteCopyForAdmin() {
  const rows = await withDbRetry(() =>
    prisma.siteCopy.findMany({ include: { updatedBy: { select: { email: true } } } }),
  );
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return SITE_COPY_KEYS.map((key) => ({ key, data: byKey.get(key) ?? null }));
}
