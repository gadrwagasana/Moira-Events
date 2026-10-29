import { prisma } from "@/lib/db";

// Admin-only, no auth check of its own (matches this project's established
// data-layer convention — the caller gates access). Excludes soft-deleted
// rows (deletedAt not null) always, regardless of search term.
export async function listMediaAssets(search?: string) {
  const needle = search?.trim();
  return prisma.mediaAsset.findMany({
    where: {
      deletedAt: null,
      ...(needle ? { altText: { contains: needle, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { email: true } } },
  });
}

export async function getMediaAssetById(id: string) {
  return prisma.mediaAsset.findFirst({
    where: { id, deletedAt: null },
    include: { uploadedBy: { select: { email: true } } },
  });
}
