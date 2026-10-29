"use server";

// Mutation-side Server Actions for SiteImageSlot/PortfolioItem. Follows the
// same convention as lib/cms/actions.ts: Zod validation, revalidatePath, and
// auditEventQuery in the same $transaction as the write.
//
// Image storage decision (flagged to the owner, not assumed): there is no
// upload pipeline — lib/media/provider.ts is still a no-op seam, and Vercel
// Blob was never approved. An admin pastes a URL to an already-hosted photo
// instead of uploading a file. Real compression still happens, just at
// render time: next.config.mjs now allow-lists https:// remote images for
// next/image, so every pasted URL is still fetched, resized, and re-encoded
// to AVIF/WebP by Next's own image optimizer when <CmsImage> renders it —
// this is a render-time guarantee, not a stored-file guarantee, which is
// the honest limit of a URL-based mechanism.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin/auth";
import { auditEventQuery, recordAuditEvent } from "@/lib/audit/log";
import { SITE_IMAGE_SLOT_KEYS, type SiteImageSlotKey } from "./slots";
import { PORTFOLIO_FILTER_EVENT_TYPES } from "./data";
import { isSafeImageHostUrl } from "./url-safety";

// Beyond requiring https://, this rejects credential-bearing URLs and
// URLs pointing at loopback/private/link-local/reserved hosts — these
// pasted URLs are fetched server-side by Next's image optimizer
// (next.config.mjs allow-lists https hostname "**"), so a plain scheme
// check isn't enough; see lib/site-images/url-safety.ts for what this
// does and does not cover (notably: not a defense against DNS rebinding).
const httpsImageUrlSchema = z.string().trim().superRefine((val, ctx) => {
  const result = isSafeImageHostUrl(val);
  if (!result.ok) ctx.addIssue({ code: "custom", message: result.reason });
});

function revalidateAllPublicImagePages() {
  // One slot key always maps to exactly one page (see slots.ts); the list
  // is small and fixed, so revalidating all of it unconditionally costs
  // nothing and can't drift out of sync with a future slot addition.
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/weddings");
  revalidatePath("/parties-social-events");
  revalidatePath("/corporate-events");
}

const upsertSlotSchema = z
  .object({
    imageUrl: z.union([httpsImageUrlSchema, z.literal("")]),
    alt: z.string().trim().max(200),
    caption: z.string().trim().max(200).optional(),
    focalX: z.coerce.number().int().min(0).max(100),
    focalY: z.coerce.number().int().min(0).max(100),
  })
  .refine((v) => !v.imageUrl || v.alt.length > 0, {
    message: "Alt text is required whenever an image URL is set.",
    path: ["alt"],
  });

export async function upsertSiteImageSlot(key: string, formData: FormData) {
  const admin = await requireAdminRole("EDITOR");

  if (!SITE_IMAGE_SLOT_KEYS.includes(key as SiteImageSlotKey)) {
    return { status: "error" as const, message: "Unknown image slot." };
  }

  const parsed = upsertSlotSchema.safeParse({
    imageUrl: formData.get("imageUrl") ?? "",
    alt: formData.get("alt") ?? "",
    caption: formData.get("caption") || undefined,
    focalX: formData.get("focalX") ?? 50,
    focalY: formData.get("focalY") ?? 50,
  });
  if (!parsed.success) {
    return { status: "error" as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const hasImage = data.imageUrl.length > 0;

  await prisma.$transaction([
    prisma.siteImageSlot.upsert({
      where: { key },
      create: {
        key,
        imageUrl: hasImage ? data.imageUrl : null,
        alt: hasImage ? data.alt : null,
        caption: data.caption || null,
        focalX: data.focalX,
        focalY: data.focalY,
        updatedById: admin.id,
      },
      update: {
        imageUrl: hasImage ? data.imageUrl : null,
        alt: hasImage ? data.alt : null,
        caption: data.caption || null,
        focalX: data.focalX,
        focalY: data.focalY,
        updatedById: admin.id,
      },
    }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: admin.id,
      action: "site_image_slot.updated",
      entityType: "SiteImageSlot",
      entityId: key,
      outcome: "SUCCESS",
      summary: `Image slot "${key}" updated by ${admin.email}`,
    }),
  ]);

  revalidatePath("/admin/site-images");
  revalidateAllPublicImagePages();
  return { status: "success" as const };
}

const portfolioEventTypeSchema = z.enum(PORTFOLIO_FILTER_EVENT_TYPES);

const portfolioItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  eventType: portfolioEventTypeSchema,
  guestCount: z.coerce.number().int().min(0).max(100000).optional(),
  venueOrCity: z.string().trim().max(200).optional(),
  story: z.string().trim().max(2000).optional(),
  imageUrl: z.union([httpsImageUrlSchema, z.literal("")]),
  alt: z.string().trim().max(200).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

function parsePortfolioForm(formData: FormData) {
  return portfolioItemSchema.safeParse({
    title: formData.get("title"),
    eventType: formData.get("eventType"),
    guestCount: formData.get("guestCount") || undefined,
    venueOrCity: formData.get("venueOrCity") || undefined,
    story: formData.get("story") || undefined,
    imageUrl: formData.get("imageUrl") ?? "",
    alt: formData.get("alt") || undefined,
    sortOrder: formData.get("sortOrder") || undefined,
  });
}

export async function createPortfolioItem(formData: FormData) {
  const admin = await requireAdminRole("EDITOR");

  const parsed = parsePortfolioForm(formData);
  if (!parsed.success) {
    return { status: "error" as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  if (data.imageUrl && !data.alt) {
    return { status: "error" as const, message: "Alt text is required whenever an image URL is set." };
  }

  // The audit entry needs the row's generated id, so it can't share a
  // $transaction array with the create that produces it (unlike
  // lib/cms/actions.ts's createCmsPage, which has an admin-chosen slug to
  // key off before the row exists) — written as a second statement instead.
  const item = await prisma.portfolioItem.create({
    data: {
      title: data.title,
      eventType: data.eventType,
      guestCount: data.guestCount ?? null,
      venueOrCity: data.venueOrCity || null,
      story: data.story || null,
      imageUrl: data.imageUrl || null,
      alt: data.imageUrl ? data.alt || null : null,
      sortOrder: data.sortOrder ?? 0,
      authorId: admin.id,
    },
  });
  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: admin.id,
    action: "portfolio_item.created",
    entityType: "PortfolioItem",
    entityId: item.id,
    outcome: "SUCCESS",
    summary: `Portfolio item "${data.title}" created as unpublished by ${admin.email}`,
  });
  revalidatePath("/admin/portfolio");
  return { status: "success" as const, itemId: item.id };
}

export async function updatePortfolioItem(itemId: string, formData: FormData) {
  const admin = await requireAdminRole("EDITOR");

  const parsed = parsePortfolioForm(formData);
  if (!parsed.success) {
    return { status: "error" as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  if (data.imageUrl && !data.alt) {
    return { status: "error" as const, message: "Alt text is required whenever an image URL is set." };
  }

  await prisma.$transaction([
    prisma.portfolioItem.update({
      where: { id: itemId },
      data: {
        title: data.title,
        eventType: data.eventType,
        guestCount: data.guestCount ?? null,
        venueOrCity: data.venueOrCity || null,
        story: data.story || null,
        imageUrl: data.imageUrl || null,
        alt: data.imageUrl ? data.alt || null : null,
        sortOrder: data.sortOrder ?? 0,
      },
    }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: admin.id,
      action: "portfolio_item.updated",
      entityType: "PortfolioItem",
      entityId: itemId,
      outcome: "SUCCESS",
      summary: `Portfolio item "${data.title}" edited by ${admin.email}`,
    }),
  ]);
  revalidatePath("/admin/portfolio");
  revalidatePath(`/admin/portfolio/${itemId}`);
  revalidatePath("/portfolio");
  return { status: "success" as const };
}

export async function publishPortfolioItem(itemId: string) {
  const admin = await requireAdminRole("ADMIN");
  const item = await prisma.portfolioItem.findUniqueOrThrow({ where: { id: itemId } });

  if (!item.imageUrl && !item.story) {
    return {
      status: "error" as const,
      message: "Add an image or a story before publishing — an empty card can't go live.",
    };
  }

  await prisma.$transaction([
    prisma.portfolioItem.update({ where: { id: itemId }, data: { published: true } }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: admin.id,
      action: "portfolio_item.published",
      entityType: "PortfolioItem",
      entityId: itemId,
      outcome: "SUCCESS",
      beforeValue: "false",
      afterValue: "true",
      summary: `Portfolio item "${item.title}" published by ${admin.email}`,
    }),
  ]);
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  return { status: "success" as const };
}

export async function unpublishPortfolioItem(itemId: string) {
  const admin = await requireAdminRole("ADMIN");
  const item = await prisma.portfolioItem.findUniqueOrThrow({ where: { id: itemId } });

  await prisma.$transaction([
    prisma.portfolioItem.update({ where: { id: itemId }, data: { published: false } }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: admin.id,
      action: "portfolio_item.unpublished",
      entityType: "PortfolioItem",
      entityId: itemId,
      outcome: "SUCCESS",
      beforeValue: "true",
      afterValue: "false",
      summary: `Portfolio item "${item.title}" unpublished by ${admin.email}`,
    }),
  ]);
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  return { status: "success" as const };
}

export async function deletePortfolioItem(itemId: string) {
  const admin = await requireAdminRole("ADMIN");
  const item = await prisma.portfolioItem.findUniqueOrThrow({ where: { id: itemId } });

  await prisma.$transaction([
    prisma.portfolioItem.delete({ where: { id: itemId } }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: admin.id,
      action: "portfolio_item.deleted",
      entityType: "PortfolioItem",
      entityId: itemId,
      outcome: "SUCCESS",
      summary: `Portfolio item "${item.title}" deleted by ${admin.email}`,
    }),
  ]);
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  return { status: "success" as const };
}
