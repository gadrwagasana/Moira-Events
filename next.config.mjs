/** @type {import('next').NextConfig} */
const nextConfig = {
  // Was `unoptimized: true` (no real photos existed yet, so there was
  // nothing to optimize). Real photography now goes through next/image's
  // real pipeline — AVIF/WebP negotiation, resizing, and blur-up
  // placeholders all require this to be off. Vercel's built-in image
  // optimization handles this natively.
  //
  // remotePatterns (https only) exists because CMS image slots/portfolio
  // photos (lib/site-images) are URL-based, not uploaded — there is no
  // upload pipeline or Vercel Blob integration, so an admin pastes a URL to
  // an already-hosted photo instead. Allow-listing https broadly (rather
  // than one known host) is what makes that actually work for whatever host
  // an admin pastes; it's an acceptable trust boundary because only an
  // authenticated EDITOR/ADMIN can ever set one (lib/site-images/actions.ts
  // requireAdminRole), the same trust level as every other CMS field. This
  // also means a pasted URL still gets real server-side resizing and
  // AVIF/WebP re-encoding at render time via Next's image optimizer — not
  // just a passthrough <img> — even without a stored-file pipeline.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Defaults to "bottom-left", which overlaps the admin/portal sidebar's
  // Log Out button (also in the bottom-left corner). The sidebar footer
  // additionally reserves its own safe-area padding as a second guard,
  // independent of this setting.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
