// Server-side image processing — resize to a max width and convert to
// WebP, so every uploaded image is stored in a consistent, efficient
// format regardless of what the admin's phone/camera originally produced.
// Kept separate from validation.ts so that file's tests stay dependency-
// free (no sharp, no native binary); this one is only ever called from
// lib/media/actions.ts, inside an authenticated Server Action.
import sharp from "sharp";

export const MAX_STORED_WIDTH = 2400;

export type ProcessedImage = {
  buffer: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
};

// Re-encodes to WebP (quality 82 — a standard, visually-lossless-enough
// default for web photography) and resizes only when wider than the cap;
// never upscales a smaller source image. `withoutEnlargement: true` is
// what prevents the upscale; `fit: "inside"` preserves aspect ratio.
export async function processImageForStorage(input: Buffer): Promise<ProcessedImage> {
  const pipeline = sharp(input, { failOn: "error" }).rotate(); // .rotate() with no args: auto-orient from EXIF, then strip it
  const resized = pipeline.resize({ width: MAX_STORED_WIDTH, withoutEnlargement: true, fit: "inside" });
  const { data, info } = await resized.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  return { buffer: data, contentType: "image/webp", width: info.width, height: info.height };
}
