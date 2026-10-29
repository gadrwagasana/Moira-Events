"use client";

import { useRef, useState } from "react";
import { MediaLibraryPicker } from "./MediaLibraryPicker";

export type ImageFieldValue = {
  imageUrl: string;
  alt: string;
  caption?: string;
  focalX?: number;
  focalY?: number;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

// The one shared building block for every image field in the admin (Site
// Images, Portfolio, blog cover, page OG image) — drag-and-drop + a file
// picker with real upload progress (via XHR against
// app/api/admin/media/upload, not a Server Action — see that route's own
// comment for why), a "Paste URL" fallback tab, and a "Choose from
// library" button backed by the Media Library. Alt text is always
// required once an image is set; this component enforces that in its own
// markup (required attribute) but the server independently re-validates
// it too (lib/site-images/actions.ts, lib/cms/actions.ts) — this is UX,
// not the security boundary.
export function ImageUploadField({
  imageUrl,
  alt,
  onImageUrlChange,
  onAltChange,
  previewClassName = "aspect-[4/3]",
  previewChildren,
}: {
  imageUrl: string;
  alt: string;
  onImageUrlChange: (url: string) => void;
  onAltChange: (alt: string) => void;
  previewClassName?: string;
  previewChildren?: (imageUrl: string) => React.ReactNode;
}) {
  const [mode, setMode] = useState<"upload" | "url">(imageUrl ? "url" : "upload");
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function uploadFile(file: File) {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Unsupported file type — use JPG, PNG, WebP, or AVIF.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("File is too large (max 15MB).");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      try {
        const result = JSON.parse(xhr.responseText);
        if (result.status === "success") {
          onImageUrlChange(result.url);
          setMode("url");
        } else {
          setError(result.message || "Upload failed.");
        }
      } catch {
        setError("Upload failed — unexpected server response.");
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("Upload failed — network error.");
    };
    setProgress(0);
    xhr.send(formData);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg bg-ivory-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
            mode === "upload" ? "bg-ivory-50 text-espresso-700 shadow-sm" : "text-ink/60"
          }`}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
            mode === "url" ? "bg-ivory-50 text-espresso-700 shadow-sm" : "text-ink/60"
          }`}
        >
          Paste URL
        </button>
      </div>

      {mode === "upload" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center text-sm transition-colors ${
            dragActive ? "border-espresso-500 bg-espresso-50" : "border-espresso-200 bg-ivory-50 hover:border-espresso-300"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
              e.target.value = "";
            }}
          />
          {progress !== null ? (
            <div className="w-full max-w-xs">
              <div className="h-2 overflow-hidden rounded-full bg-ivory-200">
                <div className="h-full bg-espresso-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-ink/50">Uploading… {progress}%</p>
            </div>
          ) : (
            <>
              <p className="text-ink/70">Drag a photo here, or click to choose a file</p>
              <p className="text-xs text-ink/40">JPG, PNG, WebP, or AVIF — up to 15MB</p>
            </>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLibraryOpen(true);
            }}
            className="focus-ring mt-1 rounded px-2 py-1 text-xs font-medium text-espresso-600 hover:underline"
          >
            Choose from library
          </button>
        </div>
      ) : (
        <div>
          <input
            className="field-input"
            type="url"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
          />
          <p className="mt-1 text-xs text-ink/50">https:// only.</p>
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="focus-ring mt-1 rounded px-2 py-1 text-xs font-medium text-espresso-600 hover:underline"
          >
            Choose from library
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div>
        <label className="field-label">
          Alt text{imageUrl && <span className="text-red-600"> *</span>}
        </label>
        <input
          className="field-input"
          maxLength={200}
          required={Boolean(imageUrl)}
          value={alt}
          onChange={(e) => onAltChange(e.target.value)}
        />
      </div>

      {imageUrl && (
        <div className={`relative overflow-hidden rounded-lg border border-espresso-100 bg-gradient-to-br from-ivory-200 to-espresso-100 ${previewClassName}`}>
          {previewChildren ? (
            previewChildren(imageUrl)
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
      )}

      {libraryOpen && (
        <MediaLibraryPicker
          onClose={() => setLibraryOpen(false)}
          onSelect={(asset) => {
            onImageUrlChange(asset.url);
            if (asset.altText) onAltChange(asset.altText);
            setMode("url");
            setLibraryOpen(false);
          }}
        />
      )}
    </div>
  );
}
