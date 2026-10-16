import type { MetadataRoute } from "next";

// A crawl hint, not a security boundary — proxy.ts's auth gate is what
// actually protects /admin and /portal; this just asks well-behaved
// crawlers not to index them.
export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/portal", "/api"],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
