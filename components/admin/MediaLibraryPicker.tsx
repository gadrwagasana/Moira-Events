"use client";

import { useEffect, useState } from "react";
import { listMediaAssetsForPicker } from "@/lib/media/actions";

type Asset = { id: string; url: string; altText: string | null; width: number | null; height: number | null };

export function MediaLibraryPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (asset: Asset) => void;
}) {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    listMediaAssetsForPicker(search).then((result) => {
      if (!cancelled) setAssets(result);
    });
    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-900/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Media library"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-ivory-50"
      >
        <div className="flex items-center justify-between border-b border-espresso-100 p-4">
          <h2 className="font-serif text-lg text-espresso-700">Choose from Media Library</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="focus-ring rounded p-1 text-ink/50 hover:text-ink">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="border-b border-espresso-100 p-4">
          <input
            className="field-input"
            type="search"
            placeholder="Search by alt text…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-y-auto p-4">
          {assets === null && <p className="text-sm text-ink/50">Loading…</p>}
          {assets?.length === 0 && <p className="text-sm text-ink/50">No images in the library yet.</p>}
          {assets && assets.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onSelect(asset)}
                  className="focus-ring group relative aspect-square overflow-hidden rounded-lg border border-espresso-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt={asset.altText ?? ""} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  {!asset.altText && (
                    <span className="absolute left-1 top-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      No alt
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
