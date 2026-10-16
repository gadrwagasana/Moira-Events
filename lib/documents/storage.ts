// Stage M, Phase C — defines the seam for persistent document storage
// without integrating a real provider: no cloud credentials exist in this
// project today (checked package.json and .env.example — confirmed empty),
// and inventing them would violate "do not assume a cloud service is
// configured." Nothing in this codebase calls .store() yet; L1's on-demand
// PDF regeneration keeps working exactly as before. Swapping in a real
// provider later (S3, Vercel Blob, etc.) is a one-function change, same
// pattern as lib/email/send.ts's provider gate — implement a
// DocumentStorageProvider and return it from getStorageProvider() below.
//
// See SETUP.md for the environment variables a real provider would need.
export interface DocumentStorageProvider {
  isConfigured(): boolean;
  store(key: string, buffer: Buffer, contentType: string): Promise<{ storageKey: string }>;
}

export const noopStorageProvider: DocumentStorageProvider = {
  isConfigured: () => false,
  store: async () => {
    throw new Error("No persistent document storage provider is configured.");
  },
};

export function getStorageProvider(): DocumentStorageProvider {
  return noopStorageProvider;
}
