import type { Metadata } from "next";
import { listMediaAssets } from "@/lib/media/data";
import { getMediaAssetUsage } from "@/lib/media/actions";
import { requireAdminRole } from "@/lib/admin/auth";
import { MediaLibraryGrid } from "./MediaLibraryGrid";

export const metadata: Metadata = { title: "Media Library — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminMediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminRole("EDITOR");
  const { q = "" } = await searchParams;

  const assets = await listMediaAssets(q);
  const withUsage = await Promise.all(
    assets.map(async (asset) => ({
      ...asset,
      usageCount: await getMediaAssetUsage(asset.id, asset.url),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-espresso-700">Media Library</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Every uploaded image, with where it&apos;s used. Delete is blocked while an image is still in use.
        </p>
      </div>

      <form className="flex gap-2">
        <input className="field-input max-w-xs" type="search" name="q" defaultValue={q} placeholder="Search by alt text..." />
        <button type="submit" className="btn-secondary">
          Search
        </button>
      </form>

      <MediaLibraryGrid
        assets={withUsage.map((a) => ({
          id: a.id,
          url: a.url,
          altText: a.altText,
          width: a.width,
          height: a.height,
          fileSizeBytes: a.fileSizeBytes,
          uploadedByEmail: a.uploadedBy?.email ?? null,
          createdAt: a.createdAt.toISOString(),
          usageCount: a.usageCount,
        }))}
      />
    </div>
  );
}
