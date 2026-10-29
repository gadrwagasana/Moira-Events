import type { Metadata } from "next";
import { getSiteSettingsForAdmin } from "@/lib/settings/data";
import { requireAdminRole } from "@/lib/admin/auth";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Site Settings — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  // ADMIN-only — these values affect the entire public site (contact
  // details, CTAs, social links), unlike CMS content's EDITOR-or-ADMIN
  // split for drafts.
  await requireAdminRole("ADMIN");
  const settings = await getSiteSettingsForAdmin();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-espresso-700">Site Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {settings?.updatedAt
            ? `Last updated ${settings.updatedAt.toLocaleString()}${settings.updatedBy?.email ? ` by ${settings.updatedBy.email}` : ""}`
            : "Never saved yet — the public site is using its built-in defaults."}
        </p>
      </div>
      <SettingsForm
        initial={{
          siteName: settings?.siteName ?? "Moira Events",
          logoUrl: settings?.logoUrl ?? null,
          faviconUrl: settings?.faviconUrl ?? null,
          phoneE164: settings?.phoneE164 ?? null,
          contactEmail: settings?.contactEmail ?? null,
          whatsappNumber: settings?.whatsappNumber ?? null,
          addressLine: settings?.addressLine ?? null,
          city: settings?.city ?? null,
          openingHours: settings?.openingHours ?? null,
          googleMapsUrl: settings?.googleMapsUrl ?? null,
          instagramUrl: settings?.instagramUrl ?? null,
          facebookUrl: settings?.facebookUrl ?? null,
          tiktokUrl: settings?.tiktokUrl ?? null,
          linkedinUrl: settings?.linkedinUrl ?? null,
          youtubeUrl: settings?.youtubeUrl ?? null,
          primaryCtaLabel: settings?.primaryCtaLabel ?? null,
          primaryCtaHref: settings?.primaryCtaHref ?? null,
          secondaryCtaLabel: settings?.secondaryCtaLabel ?? null,
          secondaryCtaHref: settings?.secondaryCtaHref ?? null,
        }}
      />
    </div>
  );
}
