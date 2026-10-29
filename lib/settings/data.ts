import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/content/config";

export type SiteSettingsValue = Awaited<ReturnType<typeof getSiteSettings>>;

// A plain, uncached read — deliberately consistent with every other data
// loader in this codebase (lib/cms/data.ts, lib/site-images/data.ts, etc.):
// none of them use unstable_cache; all of them rely on Next's own
// page-level Full Route Cache plus revalidatePath on mutation
// (lib/settings/actions.ts calls revalidatePath('/', 'layout'), which
// purges every public page's cache in one call — the correct tool here,
// since Site Settings is read by effectively every public page, not a
// small enumerable list). unstable_cache was tried first but dropped: it's
// now explicitly deprecated in favor of Next 16's "use cache" directive,
// and revalidateTag's signature changed to require a cache-life profile
// argument this project doesn't otherwise use anywhere — not worth taking
// on a second, half-adopted caching model for one data loader.
//
// Sensible, honest defaults for every field — merged in whenever the
// singleton row doesn't exist yet (first run, before any admin has saved
// anything) or a given field was never filled in, so public pages always
// get a usable value and never need to null-check every field at every
// call site. Values genuinely never confirmed for this business (city,
// social links, SEO IDs) default to null/empty, never a fabricated value.
export async function getSiteSettings() {
  const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return {
    siteName: row?.siteName ?? siteConfig.name,
    logoUrl: row?.logoUrl ?? null,
    faviconUrl: row?.faviconUrl ?? null,
    // These three carry forward the already-confirmed real business facts
    // from lib/content/config.ts (not a fabricated default) so a fresh
    // install doesn't show blank contact info before an admin has ever
    // opened Site Settings — the admin value simply overrides this once set.
    phoneE164: row?.phoneE164 ?? siteConfig.phoneIntl,
    contactEmail: row?.contactEmail ?? siteConfig.email,
    whatsappNumber: row?.whatsappNumber ?? siteConfig.whatsappNumber,
    addressLine: row?.addressLine ?? null,
    // No specific city has ever been confirmed for this business — stays
    // null by default, never defaulted to siteConfig.country (which is
    // "Rwanda," a country, not a city) or any invented value.
    city: row?.city ?? null,
    openingHours: row?.openingHours ?? null,
    googleMapsUrl: row?.googleMapsUrl ?? null,
    instagramUrl: row?.instagramUrl ?? null,
    facebookUrl: row?.facebookUrl ?? null,
    tiktokUrl: row?.tiktokUrl ?? null,
    linkedinUrl: row?.linkedinUrl ?? null,
    youtubeUrl: row?.youtubeUrl ?? null,
    primaryCtaLabel: row?.primaryCtaLabel ?? null,
    primaryCtaHref: row?.primaryCtaHref ?? null,
    secondaryCtaLabel: row?.secondaryCtaLabel ?? null,
    secondaryCtaHref: row?.secondaryCtaHref ?? null,
    titleTemplate: row?.titleTemplate ?? "%s | Moira Events",
    defaultMetaDescription: row?.defaultMetaDescription ?? null,
    defaultOgImageUrl: row?.defaultOgImageUrl ?? null,
    gscVerification: row?.gscVerification ?? null,
    ga4Id: row?.ga4Id ?? null,
    metaPixelId: row?.metaPixelId ?? null,
    quoteRecipientEmail: row?.quoteRecipientEmail ?? null,
    consultationRecipientEmail: row?.consultationRecipientEmail ?? null,
    contactRecipientEmail: row?.contactRecipientEmail ?? null,
    quoteAutoReplyTemplate: row?.quoteAutoReplyTemplate ?? null,
    consultationAutoReplyTemplate: row?.consultationAutoReplyTemplate ?? null,
    contactAutoReplyTemplate: row?.contactAutoReplyTemplate ?? null,
    whatsappSmsNotifyEnabled: row?.whatsappSmsNotifyEnabled ?? false,
    announcementText: row?.announcementText ?? null,
    announcementLink: row?.announcementLink ?? null,
    announcementColor: row?.announcementColor ?? null,
    announcementStartAt: row?.announcementStartAt ?? null,
    announcementEndAt: row?.announcementEndAt ?? null,
    announcementDismissible: row?.announcementDismissible ?? true,
    maintenanceModeEnabled: row?.maintenanceModeEnabled ?? false,
    maintenanceMessage: row?.maintenanceMessage ?? null,
    cookieConsentText: row?.cookieConsentText ?? null,
    updatedAt: row?.updatedAt ?? null,
  };
}

// Admin edit screen — separately includes who last saved it.
export async function getSiteSettingsForAdmin() {
  return prisma.siteSettings.findUnique({
    where: { id: 1 },
    include: { updatedBy: { select: { email: true } } },
  });
}
