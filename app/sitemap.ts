import type { MetadataRoute } from "next";

// Exactly the 11 public routes — admin/portal/api are intentionally
// excluded (see app/robots.ts).
const PUBLIC_PATHS = [
  "/",
  "/about",
  "/weddings",
  "/parties-social-events",
  "/corporate-events",
  "/services",
  "/portfolio",
  "/how-it-works",
  "/request-a-quote",
  "/book-a-consultation",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return PUBLIC_PATHS.map((path) => ({
    url: `${appUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));
}
