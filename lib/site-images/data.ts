// Read-side data access for SiteImageSlot/PortfolioItem — no auth check of
// its own (this project's established convention, matching lib/cms/data.ts),
// EXCEPT getAllSiteImageSlots/listPublishedPortfolioItems, which are safe to
// call from a public route because an empty/missing row always normalizes
// to null rather than ever leaking a draft value.
import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { SITE_IMAGE_SLOTS, type SiteImageSlotKey } from "./slots";

export type ResolvedSiteImageSlot = {
  imageUrl: string;
  alt: string;
  caption: string | null;
  focalX: number;
  focalY: number;
} | null;

// Public rendering — every fixed slot key, normalized so a slot that was
// never set (or was cleared) comes back as null rather than a half-filled
// row, so <CmsImage> never has to re-derive "is this actually usable."
export async function getAllSiteImageSlots(): Promise<Record<SiteImageSlotKey, ResolvedSiteImageSlot>> {
  const rows = await prisma.siteImageSlot.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const result = {} as Record<SiteImageSlotKey, ResolvedSiteImageSlot>;
  for (const { key } of SITE_IMAGE_SLOTS) {
    const row = byKey.get(key);
    result[key] =
      row?.imageUrl && row.alt
        ? { imageUrl: row.imageUrl, alt: row.alt, caption: row.caption, focalX: row.focalX, focalY: row.focalY }
        : null;
  }
  return result;
}

// Admin "Site Images" screen — every fixed key, including ones never set,
// so the editor can see (and fill) the complete list rather than only rows
// that happen to already exist.
// Called from app/admin/(dashboard)/layout.tsx on every single admin page
// load (to badge the Site Images nav link) — wrapped with retry since a
// transient connection blip here would otherwise take down the whole admin
// sidebar/layout, not just one page's content.
export async function listSiteImageSlotsForAdmin() {
  const rows = await withDbRetry(() =>
    prisma.siteImageSlot.findMany({ include: { updatedBy: { select: { email: true } } } }),
  );
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return SITE_IMAGE_SLOTS.map((def) => ({ ...def, data: byKey.get(def.key) ?? null }));
}

export const PORTFOLIO_FILTER_EVENT_TYPES = ["WEDDING", "PARTY", "CORPORATE"] as const;
export type PortfolioFilterEventType = (typeof PORTFOLIO_FILTER_EVENT_TYPES)[number];

// Public portfolio grid. Deliberately excludes any item missing BOTH an
// image and a story even if marked published — enforced again here (not
// just at write-time) so a row published before this rule existed, or
// edited directly, can never surface as an empty card.
export async function listPublishedPortfolioItems(eventType?: PortfolioFilterEventType) {
  const items = await prisma.portfolioItem.findMany({
    where: { published: true, ...(eventType ? { eventType } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return items.filter((item) => item.imageUrl || item.story);
}

export async function listPortfolioItemsForAdmin() {
  return prisma.portfolioItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { author: { select: { email: true } } },
  });
}

export async function getPortfolioItemById(id: string) {
  return prisma.portfolioItem.findUnique({
    where: { id },
    include: { author: { select: { email: true } } },
  });
}
