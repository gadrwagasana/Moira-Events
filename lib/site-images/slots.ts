// The fixed, hand-maintained list of named image slots on the public
// website — each one a specific position on a specific existing page, not
// freeform CMS content (that's what CmsPage/CmsPageSection is for). Adding a
// new slot to a page means adding one entry here AND rendering it with
// <CmsImage> at that spot — the two are not derived from each other.
export const SITE_IMAGE_SLOTS = [
  {
    key: "home-hero",
    label: "Homepage Hero",
    page: "Homepage",
    pageHref: "/",
    aspectHint: "16:9 on mobile, 1:1 on desktop — at least 1200×1200px",
  },
  {
    key: "home-why-moira",
    label: "Homepage — Why Moira Events",
    page: "Homepage",
    pageHref: "/",
    aspectHint: "4:3 — at least 1200×900px",
  },
  {
    key: "about-team",
    label: "About — Team Photo",
    page: "About",
    pageHref: "/about",
    aspectHint: "4:3 — at least 1200×900px",
  },
  {
    key: "division-weddings-hero",
    label: "Weddings — Hero",
    page: "Weddings",
    pageHref: "/weddings",
    aspectHint: "4:3 — at least 1200×900px",
  },
  {
    key: "division-weddings-team",
    label: "Weddings — Team at Work",
    page: "Weddings",
    pageHref: "/weddings",
    aspectHint: "4:3 — at least 1200×900px",
  },
  {
    key: "division-parties-social-events-hero",
    label: "Parties & Social Events — Hero",
    page: "Parties & Social Events",
    pageHref: "/parties-social-events",
    aspectHint: "4:3 — at least 1200×900px",
  },
  {
    key: "division-parties-social-events-team",
    label: "Parties & Social Events — Team at Work",
    page: "Parties & Social Events",
    pageHref: "/parties-social-events",
    aspectHint: "4:3 — at least 1200×900px",
  },
  {
    key: "division-corporate-events-hero",
    label: "Corporate Events — Hero",
    page: "Corporate Events",
    pageHref: "/corporate-events",
    aspectHint: "4:3 — at least 1200×900px",
  },
  {
    key: "division-corporate-events-team",
    label: "Corporate Events — Team at Work",
    page: "Corporate Events",
    pageHref: "/corporate-events",
    aspectHint: "4:3 — at least 1200×900px",
  },
] as const;

export type SiteImageSlotKey = (typeof SITE_IMAGE_SLOTS)[number]["key"];

export const SITE_IMAGE_SLOT_KEYS = SITE_IMAGE_SLOTS.map((s) => s.key) as SiteImageSlotKey[];

// Division pages each have exactly two slots (hero + team-at-work), keyed
// off the division's own slug — derived here instead of hand-repeated at
// every division page call site.
export function divisionHeroSlotKey(divisionSlug: string): SiteImageSlotKey {
  return `division-${divisionSlug}-hero` as SiteImageSlotKey;
}
export function divisionTeamSlotKey(divisionSlug: string): SiteImageSlotKey {
  return `division-${divisionSlug}-team` as SiteImageSlotKey;
}
