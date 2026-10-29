"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMediaAsset, updateMediaAssetAlt } from "@/lib/media/actions";

type Asset = {
  id: string;
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  fileSizeBytes: number;
  uploadedByEmail: string | null;
  createdAt: string;
  usageCount: number;
};

export function MediaLibraryGrid({ assets }: { assets: Asset[] }) {
  if (assets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-espresso-200 bg-ivory-50 p-12 text-center">
        <p className="text-ink-muted">No images uploaded yet. Upload one from any image field in Pages, Blog, Site Images, or Portfolio.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {assets.map((asset) => (
        <MediaCard key={asset.id} asset={asset} />
      ))}
    </div>
  );
}

function MediaCard({ asset }: { asset: Asset }) {
  const router = useRouter();
  const [alt, setAlt] = useState(asset.altText ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function saveAlt() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateMediaAssetAlt(asset.id, alt);
      setMessage(result.status === "success" ? "Saved." : result.message ?? "Failed.");
      if (result.status === "success") router.refresh();
    });
  }

  function handleDelete() {
    if (asset.usageCount > 0) return;
    if (!confirm("Delete this image? This can't be undone.")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteMediaAsset(asset.id);
      if (result.status === "error") {
        setMessage(result.message ?? "Failed.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-espresso-100 bg-ivory-50">
      <div className="relative aspect-square bg-gradient-to-br from-ivory-200 to-espresso-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.url} alt={asset.altText ?? ""} className="h-full w-full object-cover" />
        {asset.usageCount > 0 ? (
          <span className="absolute left-2 top-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            Used in {asset.usageCount}
          </span>
        ) : (
          <span className="absolute left-2 top-2 rounded-full bg-ivory-200 px-2 py-0.5 text-xs font-medium text-ink/60">Unused</span>
        )}
      </div>
      <div className="space-y-2 p-3">
        <p className="text-xs text-ink/50">
          {asset.width}×{asset.height} · {(asset.fileSizeBytes / 1024).toFixed(0)}KB
        </p>
        <input
          className="field-input text-sm"
          placeholder="Alt text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onBlur={saveAlt}
        />
        {message && <p className="text-xs text-ink/60">{message}</p>}
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink/40">{asset.uploadedByEmail ?? "—"}</p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending || asset.usageCount > 0}
            title={asset.usageCount > 0 ? "In use — can't delete" : "Delete"}
            className="text-xs font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-ink/30 disabled:no-underline"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
