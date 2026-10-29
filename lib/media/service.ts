// Shared core of the upload pipeline — called from both the Server Action
// (lib/media/actions.ts, works without JS / as a plain form submission)
// and the API route (app/api/admin/media/upload/route.ts, used by the
// drag-and-drop uploader specifically because only a raw XHR/fetch request
// to a route — not a Server Action — can expose real upload-progress
// events to the browser). Keeping one implementation avoids the two
// call paths silently drifting apart.
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit/log";
import { validateUploadedImage, generateSafeStorageKey } from "./validation";
import { processImageForStorage } from "./process";
import { getMediaStorageProvider } from "./provider";

export type UploadMediaResult =
  | { status: "error"; message: string }
  | { status: "success"; assetId: string; url: string; width: number | null; height: number | null };

export async function performMediaUpload(
  admin: { id: string; email: string },
  fileBuffer: Buffer,
  altText: string | undefined,
): Promise<UploadMediaResult> {
  const provider = getMediaStorageProvider();
  if (!provider.isConfigured()) {
    return {
      status: "error",
      message: "Media storage isn't configured yet — ask an administrator to connect Vercel Blob, or paste an already-hosted image URL instead.",
    };
  }

  const validation = validateUploadedImage(fileBuffer);
  if (!validation.ok) {
    return { status: "error", message: validation.message };
  }

  let processed;
  try {
    processed = await processImageForStorage(fileBuffer);
  } catch {
    return { status: "error", message: "That file couldn't be read as an image." };
  }

  const key = generateSafeStorageKey(processed.contentType);
  const { storageKey, url } = await provider.upload({
    key,
    buffer: processed.buffer,
    contentType: processed.contentType,
  });

  const asset = await prisma.mediaAsset.create({
    data: {
      storageProvider: "vercel-blob",
      storageKey,
      url,
      altText: altText?.trim() || null,
      mimeType: processed.contentType,
      fileSizeBytes: processed.buffer.length,
      width: processed.width,
      height: processed.height,
      uploadedById: admin.id,
    },
  });

  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: admin.id,
    action: "media_asset.uploaded",
    entityType: "MediaAsset",
    entityId: asset.id,
    outcome: "SUCCESS",
    summary: `Media asset uploaded by ${admin.email} (${processed.width}x${processed.height})`,
  });

  return { status: "success", assetId: asset.id, url: asset.url, width: asset.width, height: asset.height };
}
