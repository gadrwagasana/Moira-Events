import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

// Exactly the 11 static public routes — admin/portal/api are intentionally
// excluded (see app/robots.ts). CMS-authored pages (app/(site)/[slug]) are
// added below by querying published rows directly — slugSchema's
// RESERVED_SLUGS (lib/cms/slug.ts) guarantees none of these can ever collide
// with this static list.
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const staticEntries = PUBLIC_PATHS.map((path) => ({
    url: `${appUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));

  // Phase M fix: previously this hardcoded list was the entire sitemap, so a
  // published CmsPage was never discoverable here at all (an under-exposure
  // gap, not an over-exposure one — nothing leaked, but published content
  // was also never listed). Only ever queries status: "PUBLISHED", the same
  // filter getPublishedCmsPageBySlug uses, so a draft/unpublished page still
  // can't appear here by construction.
  const publishedPages = await prisma.cmsPage.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });
  const cmsEntries = publishedPages.map((page) => ({
    url: `${appUrl}/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const publishedPosts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });
  // /blog itself (the listing) is hidden by app/(site)/blog/page.tsx while
  // there are zero published posts, so it's only worth listing here once
  // there's something to actually list.
  const blogEntries =
    publishedPosts.length > 0
      ? [
          { url: `${appUrl}/blog`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
          ...publishedPosts.map((post) => ({
            url: `${appUrl}/blog/${post.slug}`,
            lastModified: post.updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.5,
          })),
        ]
      : [];

  return [...staticEntries, ...cmsEntries, ...blogEntries];
}
