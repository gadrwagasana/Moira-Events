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
// Vercel's serverless functions cap request body size at roughly 4.5MB —
// a hard platform limit this app's own code can't raise. Phone/DSLR
// photos routinely exceed that long before they hit the 15MB picker
// limit above, so every upload is pre-resized client-side (mirroring
// lib/media/process.ts's own MAX_STORED_WIDTH/WebP pipeline) before it's
// ever sent to the server — the server-side pipeline still runs on top
// of this smaller file unchanged, this just keeps the request itself
// under the platform's cap. 4MB leaves headroom under the ~4.5MB cap for
// multipart/form-data overhead.
const RESIZE_MAX_DIMENSION = 2400;
const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

// Animated GIFs are deliberately left untouched — canvas-based resizing
// flattens an animated image to a single static frame, which would be a
// real regression, not a compression. They still go through the original
// size check below unresized.
async function resizeForUpload(file: File): Promise<File> {
  if (file.type === "image/gif" || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, RESIZE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob) return file;
    // Only swap in the resized version if it's actually smaller — a
    // small, already-simple source image can occasionally re-encode
    // larger than it started.
    if (blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    // Decoding failed (corrupt file, an unsupported variant) — fall back
    // to the original file rather than blocking the upload entirely.
    return file;
  }
}

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

  async function uploadFile(file: File) {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Unsupported file type — use JPG, PNG, WebP, or AVIF.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("File is too large (max 15MB).");
      return;
    }

    const toSend = await resizeForUpload(file);
    if (toSend.size > MAX_REQUEST_BYTES) {
      setError("This photo is too large to upload even after compressing — try a smaller or simpler image.");
      return;
    }

    const formData = new FormData();
    formData.append("file", toSend);

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
