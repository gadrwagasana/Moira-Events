// Real Vercel Blob adapter, wired up per the owner's explicit choice
// (storage-provider decision made for this ticket). Mirrors
// lib/documents/storage.ts's interface-plus-noop pattern: isConfigured()
// gates every call site, so the rest of the app never has to special-case
// "what if no provider is set" beyond checking that one boolean.
//
// Required environment variable: BLOB_READ_WRITE_TOKEN — provisioned
// automatically by Vercel when a Blob store is connected to this project
// (Vercel dashboard → project → Storage → Create Database → Blob). Never
// invented or hand-generated; the owner adds it to .env themselves.
import { put, del } from "@vercel/blob";

export interface MediaStorageProvider {
  isConfigured(): boolean;
  upload(args: { key: string; buffer: Buffer; contentType: string }): Promise<{ storageKey: string; url: string }>;
  delete(storageKey: string): Promise<void>;
}

export const noopMediaStorageProvider: MediaStorageProvider = {
  isConfigured: () => false,
  upload: async () => {
    throw new Error("No media storage provider is configured.");
  },
  delete: async () => {
    throw new Error("No media storage provider is configured.");
  },
};

const vercelBlobProvider: MediaStorageProvider = {
  isConfigured: () => Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  async upload({ key, buffer, contentType }) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("No media storage provider is configured.");
    // addRandomSuffix: false — generateSafeStorageKey (lib/media/validation.ts)
    // already produces a random, collision-resistant key; a second random
    // suffix would just make storageKey/url diverge from what we stored in
    // the MediaAsset row for no benefit.
    const result = await put(key, buffer, {
      access: "public",
      contentType,
      token,
      addRandomSuffix: false,
    });
    return { storageKey: key, url: result.url };
  },
  async delete(storageKey) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("No media storage provider is configured.");
    await del(storageKey, { token });
  },
};

export function getMediaStorageProvider(): MediaStorageProvider {
  return vercelBlobProvider.isConfigured() ? vercelBlobProvider : noopMediaStorageProvider;
}
