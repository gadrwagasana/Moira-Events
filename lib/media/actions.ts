"use server";

// Real upload pipeline: validate (magic-byte sniff, size cap) → resize +
// convert to WebP server-side (lib/media/process.ts) → persist via
// lib/media/provider.ts (Vercel Blob once BLOB_READ_WRITE_TOKEN is set,
// otherwise cleanly refuses rather than pretending to work).
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin/auth";
import { recordAuditEvent } from "@/lib/audit/log";
import { performMediaUpload } from "./service";
import { getMediaStorageProvider } from "./provider";

// Plain-form-submission path (works without JS). The drag-and-drop
// uploader instead posts to app/api/admin/media/upload/route.ts via XHR,
// since only a raw request to a route (not a Server Action) can expose
// real upload-progress events — both call the same performMediaUpload.
export async function uploadMediaAsset(formData: FormData) {
  const admin = await requireAdminRole("EDITOR");

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { status: "error" as const, message: "No file was provided." };
  }
  const altText = z.string().trim().max(200).optional().parse(formData.get("altText") || undefined);

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await performMediaUpload(admin, buffer, altText);
  if (result.status === "success") revalidatePath("/admin/media");
  return result;
}

// Read, but exposed as a Server Action (not lib/media/data.ts, which has
// no auth check of its own per this project's convention) specifically so
// MediaLibraryPicker — a client component used from admin forms — can call
// it directly without a dedicated API route.
export async function listMediaAssetsForPicker(search?: string) {
  await requireAdminRole("EDITOR");
  const needle = search?.trim();
  return prisma.mediaAsset.findMany({
    where: { deletedAt: null, ...(needle ? { altText: { contains: needle, mode: "insensitive" } } : {}) },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { id: true, url: true, altText: true, width: true, height: true },
  });
}

export async function updateMediaAssetAlt(assetId: string, altText: string) {
  const admin = await requireAdminRole("EDITOR");
  const parsed = z.string().trim().min(1).max(200).safeParse(altText);
  if (!parsed.success) {
    return { status: "error" as const, message: "Alt text is required." };
  }
  await prisma.mediaAsset.update({ where: { id: assetId }, data: { altText: parsed.data } });
  revalidatePath("/admin/media");
  return { status: "success" as const };
}

// Checked against every place an image can be referenced in this app:
// direct foreign keys (CmsPage.ogImage, BlogPost.featuredMedia) AND plain
// URL-string fields (SiteImageSlot/PortfolioItem store a URL, not a
// MediaAsset relation — see lib/site-images's own design notes on why).
// A library asset's url matching one of those strings counts as "in use"
// even without a formal FK, since deleting it would break that slot/item
// exactly as surely as breaking a real relation would.
export async function getMediaAssetUsage(assetId: string, url: string) {
  await requireAdminRole("EDITOR");
  const [ogImageCount, featuredMediaCount, siteImageSlotCount, portfolioItemCount] = await Promise.all([
    prisma.cmsPage.count({ where: { ogImageId: assetId } }),
    prisma.blogPost.count({ where: { featuredMediaId: assetId } }),
    prisma.siteImageSlot.count({ where: { imageUrl: url } }),
    prisma.portfolioItem.count({ where: { imageUrl: url } }),
  ]);
  return ogImageCount + featuredMediaCount + siteImageSlotCount + portfolioItemCount;
}

export async function deleteMediaAsset(assetId: string) {
  const admin = await requireAdminRole("ADMIN");
  const asset = await prisma.mediaAsset.findUniqueOrThrow({ where: { id: assetId } });

  const usageCount = await getMediaAssetUsage(assetId, asset.url);
  if (usageCount > 0) {
    return {
      status: "error" as const,
      message: `This image is used in ${usageCount} place(s) and can't be deleted while in use.`,
    };
  }

  const provider = getMediaStorageProvider();
  if (provider.isConfigured()) {
    try {
      await provider.delete(asset.storageKey);
    } catch {
      // Soft-delete below still proceeds even if the remote object is
      // already gone or the provider call fails — losing the DB record
      // because of a transient storage-side error would be worse than a
      // dangling blob.
    }
  }

  await prisma.mediaAsset.update({ where: { id: assetId }, data: { deletedAt: new Date() } });

  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: admin.id,
    action: "media_asset.deleted",
    entityType: "MediaAsset",
    entityId: assetId,
    outcome: "SUCCESS",
    summary: `Media asset deleted by ${admin.email}`,
  });

  revalidatePath("/admin/media");
  return { status: "success" as const };
}
