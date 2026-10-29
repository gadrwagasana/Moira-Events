// Pure, dependency-free, fully local validation for media uploads.
// Deliberately does NOT trust a client-supplied filename extension or
// `Content-Type` header — both are attacker-controlled and the classic
// file-upload bypass (e.g. a .html/.svg/.js file relabeled as
// "image/png"). Instead this sniffs the actual file signature (magic
// bytes) from the buffer itself and only trusts that.
//
// Zero imports beyond Node's own Buffer — safe to unit-test with no
// database, no Next.js, no storage provider (see
// scripts/verify-cms-phase1-security.ts). Server-side resize/format
// conversion (which does need sharp) lives in ./process.ts, kept separate
// so this file's tests stay dependency-free.

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MiB, per the accepted-upload spec

export type SniffedImageType = "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "image/avif";

const EXTENSION_BY_MIME: Record<SniffedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function startsWith(buf: Buffer, bytes: number[], offset = 0): boolean {
  if (buf.length < offset + bytes.length) return false;
  return bytes.every((b, i) => buf[offset + i] === b);
}

function matchesAscii(buf: Buffer, ascii: string, offset = 0): boolean {
  if (buf.length < offset + ascii.length) return false;
  return buf.toString("ascii", offset, offset + ascii.length) === ascii;
}

// AVIF is an ISOBMFF/MP4-style container: a 4-byte box size, then "ftyp" at
// offset 4, then a 4-byte "major brand" at offset 8 identifying the
// container's actual format — "avif"/"avis" for AVIF specifically (the
// same container family is also used by HEIC and some MP4s, which use
// different brands, so checking the brand is what actually distinguishes
// these, not just "ftyp" alone).
function isAvif(buf: Buffer): boolean {
  if (!matchesAscii(buf, "ftyp", 4)) return false;
  const brand = buf.toString("ascii", 8, 12);
  return brand === "avif" || brand === "avis";
}

// Checks the actual bytes, not any declared/claimed type — this is the
// part of "server-side validation" that actually matters; a MIME-type
// string the client sends is just a label, never proof.
export function sniffImageMimeType(buffer: Buffer): SniffedImageType | null {
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (matchesAscii(buffer, "GIF87a") || matchesAscii(buffer, "GIF89a")) return "image/gif";
  if (matchesAscii(buffer, "RIFF") && matchesAscii(buffer, "WEBP", 8)) return "image/webp";
  if (isAvif(buffer)) return "image/avif";
  return null;
}

export type UploadValidationResult =
  | { ok: true; mimeType: SniffedImageType; extension: string }
  | { ok: false; message: string };

export function validateUploadedImage(buffer: Buffer): UploadValidationResult {
  if (buffer.length === 0) {
    return { ok: false, message: "The uploaded file is empty." };
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "The uploaded file is too large (max 15MB)." };
  }
  const mimeType = sniffImageMimeType(buffer);
  if (!mimeType) {
    return { ok: false, message: "That file doesn't look like a supported image (JPEG, PNG, WebP, or AVIF)." };
  }
  return { ok: true, mimeType, extension: EXTENSION_BY_MIME[mimeType] };
}

// Random, collision-resistant, and derived ONLY from the sniffed/target
// type — never from the original filename — so there is no path-traversal
// or double-extension trick (e.g. "photo.jpg.html") to defend against: the
// original filename is never used to build a storage key at all.
export function generateSafeStorageKey(mimeType: SniffedImageType | "image/webp"): string {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const ext = mimeType === "image/webp" ? "webp" : EXTENSION_BY_MIME[mimeType];
  return `media/${id}.${ext}`;
}
