"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin/auth";
import { recordAuditEvent } from "@/lib/audit/log";
import { isSafeImageHostUrl } from "@/lib/site-images/url-safety";

const optionalUrl = (message: string) =>
  z
    .string()
    .trim()
    .max(500)
    .optional()
    .refine((v) => !v || /^https?:\/\//.test(v), { message });

const optionalHttpsImageUrl = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || isSafeImageHostUrl(v).ok, { message: "Must be a valid https:// image URL." });

const settingsSchema = z.object({
  // Brand
  siteName: z.string().trim().min(1).max(100),
  logoUrl: optionalHttpsImageUrl,
  faviconUrl: optionalHttpsImageUrl,
  // Contact
  phoneE164: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\+\d{8,15}$/.test(v), { message: "Phone must be in E.164 form, e.g. +250787553323." }),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  whatsappNumber: z.string().trim().max(20).optional(),
  addressLine: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  openingHours: z.string().trim().max(500).optional(),
  googleMapsUrl: optionalUrl("Must be a valid URL."),
  // Social
  instagramUrl: optionalUrl("Must be a valid URL."),
  facebookUrl: optionalUrl("Must be a valid URL."),
  tiktokUrl: optionalUrl("Must be a valid URL."),
  linkedinUrl: optionalUrl("Must be a valid URL."),
  youtubeUrl: optionalUrl("Must be a valid URL."),
  // CTAs
  primaryCtaLabel: z.string().trim().max(60).optional(),
  primaryCtaHref: z.string().trim().max(300).optional(),
  secondaryCtaLabel: z.string().trim().max(60).optional(),
  secondaryCtaHref: z.string().trim().max(300).optional(),
});

function emptyToUndefined(v: FormDataEntryValue | null) {
  const s = v == null ? "" : String(v);
  return s.trim() === "" ? undefined : s;
}

export async function updateSiteSettings(formData: FormData) {
  const admin = await requireAdminRole("ADMIN");

  const parsed = settingsSchema.safeParse({
    siteName: formData.get("siteName"),
    logoUrl: emptyToUndefined(formData.get("logoUrl")),
    faviconUrl: emptyToUndefined(formData.get("faviconUrl")),
    phoneE164: emptyToUndefined(formData.get("phoneE164")),
    contactEmail: formData.get("contactEmail") || "",
    whatsappNumber: emptyToUndefined(formData.get("whatsappNumber")),
    addressLine: emptyToUndefined(formData.get("addressLine")),
    city: emptyToUndefined(formData.get("city")),
    openingHours: emptyToUndefined(formData.get("openingHours")),
    googleMapsUrl: emptyToUndefined(formData.get("googleMapsUrl")),
    instagramUrl: emptyToUndefined(formData.get("instagramUrl")),
    facebookUrl: emptyToUndefined(formData.get("facebookUrl")),
    tiktokUrl: emptyToUndefined(formData.get("tiktokUrl")),
    linkedinUrl: emptyToUndefined(formData.get("linkedinUrl")),
    youtubeUrl: emptyToUndefined(formData.get("youtubeUrl")),
    primaryCtaLabel: emptyToUndefined(formData.get("primaryCtaLabel")),
    primaryCtaHref: emptyToUndefined(formData.get("primaryCtaHref")),
    secondaryCtaLabel: emptyToUndefined(formData.get("secondaryCtaLabel")),
    secondaryCtaHref: emptyToUndefined(formData.get("secondaryCtaHref")),
  });
  if (!parsed.success) {
    return { status: "error" as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...data, updatedById: admin.id },
    update: { ...data, updatedById: admin.id },
  });

  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: admin.id,
    action: "site_settings.updated",
    entityType: "SiteSettings",
    entityId: "singleton",
    outcome: "SUCCESS",
    summary: `Site settings updated by ${admin.email}`,
  });

  // Site Settings is read by effectively every public page (header, footer,
  // Contact, JSON-LD) — revalidating the whole public (site) layout tree in
  // one call, rather than enumerating every route individually, since this
  // genuinely is "every page," not a small known list.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { status: "success" as const };
}
