// CMS Phase 1 — read-side data access for CmsPage/BlogPost. Wired into
// app/admin/(dashboard)/cms/* and app/(site)/[slug]/page.tsx in Phase 2.
// Every function here is a plain data loader with no auth check of its own
// (this project's established convention — see SETUP.md "CMS Phase 1" §5);
// the caller is responsible for the auth boundary, EXCEPT
// getPublishedCmsPageBySlug/listPublishedBlogPosts/getPublishedBlogPostBySlug,
// which are safe to call from a public, unauthenticated route because they
// filter status themselves.
import { prisma } from "@/lib/db";

export async function listCmsPages() {
  return prisma.cmsPage.findMany({
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { email: true } } },
  });
}

export async function getCmsPageBySlug(slug: string) {
  return prisma.cmsPage.findUnique({
    where: { slug },
    include: { sections: { orderBy: { sortOrder: "asc" } }, author: { select: { email: true } } },
  });
}

// For the admin edit screen — by id, not slug, since the id is stable
// across a slug edit (the edit form itself is what lets you change the
// slug). Includes DRAFT/UNPUBLISHED pages deliberately; never call this
// from a public route.
export async function getCmsPageById(id: string) {
  return prisma.cmsPage.findUnique({
    where: { id },
    include: { sections: { orderBy: { sortOrder: "asc" } }, author: { select: { email: true } } },
  });
}

// For public rendering only — never returns a DRAFT/UNPUBLISHED page, so a
// caller can never accidentally expose unpublished content just by
// forgetting a status check at the call site.
export async function getPublishedCmsPageBySlug(slug: string) {
  return prisma.cmsPage.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
}

// For the admin edit screen — by id, not slug, mirroring getCmsPageById for
// the same reason: the id is stable across a slug edit.
export async function getBlogPostById(id: string) {
  return prisma.blogPost.findUnique({
    where: { id },
    include: { author: { select: { email: true } } },
  });
}

export async function listBlogPosts() {
  return prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { email: true } } },
  });
}

export async function getBlogPostBySlug(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug },
    include: { author: { select: { email: true } }, featuredMedia: true },
  });
}

export async function getPublishedBlogPostBySlug(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { featuredMedia: true },
  });
}

export async function listPublishedBlogPosts() {
  return prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { featuredMedia: true },
  });
}
