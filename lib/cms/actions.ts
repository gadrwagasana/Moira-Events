"use server";

// CMS Phase 2 — mutation-side Server Actions for CmsPage/CmsPageSection/
// BlogPost. Follows this project's established Server Action convention:
// Zod validation, revalidatePath, and auditEventQuery inside the same
// $transaction as the business write so the mutation and its audit record
// commit or roll back together.
//
// Role policy (owner-approved, CMS Phase 2): create/edit/draft actions use
// requireAdminRole("EDITOR") — minimum-permission semantics (lib/admin/role.ts),
// so this allows BOTH an EDITOR and an ADMIN. Publish/unpublish actions use
// requireAdminRole("ADMIN") — EDITOR may prepare content but never make it
// (or unmake it) public. This exact split is why Phase 1.4 fixed
// requireAdminRole() to be minimum-permission rather than exact-match.
//
// Wired into app/admin/(dashboard)/cms/* this phase — the repository-wide
// grep invariant from Phases 1–1.4 (`lib/cms/(data|actions)` not imported
// under app/) now intentionally shows matches; that was always the
// documented signal that the cutover had started, not a standing rule.
// UNTESTED end-to-end: no migration has been applied, so none of these
// functions have ever actually written to a database.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin/auth";
import { auditEventQuery } from "@/lib/audit/log";
import { isUniqueConstraintError } from "@/lib/prisma-errors";
import { SECTION_TYPES, validateSectionContent } from "./content-schema";
import { slugSchema } from "./slug";

// generateSlugFromTitle/slugSchema/RESERVED_SLUGS live in ./slug (a plain
// module, no "use server") — see that file's comment for why: a client
// component needs generateSlugFromTitle directly, and a "use server" file
// cannot export a non-function value like slugSchema at all.

const createPageSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  metaDescription: z.string().trim().max(300).optional(),
});

export async function createCmsPage(formData: FormData) {
  const admin = await requireAdminRole("EDITOR");

  const parsed = createPageSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    metaDescription: formData.get("metaDescription") || undefined,
  });
  if (!parsed.success) {
    return { status: "error" as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    const [page] = await prisma.$transaction([
      prisma.cmsPage.create({
        data: { slug: data.slug, title: data.title, metaDescription: data.metaDescription, authorId: admin.id },
      }),
      auditEventQuery({
        actorType: "ADMIN",
        actorId: admin.id,
        action: "cms_page.created",
        entityType: "CmsPage",
        entityId: data.slug,
        outcome: "SUCCESS",
        summary: `Page "${data.title}" created as DRAFT by ${admin.email}`,
      }),
    ]);
    revalidatePath("/admin/cms");
    return { status: "success" as const, pageId: page.id };
  } catch (err) {
    if (isUniqueConstraintError(err, "slug")) {
      return { status: "error" as const, message: "That slug is already in use." };
    }
    throw err;
  }
}

const updatePageSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  metaDescription: z.string().trim().max(300).optional(),
});

export async function updateCmsPage(pageId: string, formData: FormData) {
  const admin = await requireAdminRole("EDITOR");
  const existing = await prisma.cmsPage.findUniqueOrThrow({ where: { id: pageId } });

  const parsed = updatePageSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    metaDescription: formData.get("metaDescription") || undefined,
  });
  if (!parsed.success) {
    return { status: "error" as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    await prisma.$transaction([
      prisma.cmsPage.update({
        where: { id: pageId },
        data: { slug: data.slug, title: data.title, metaDescription: data.metaDescription },
      }),
      auditEventQuery({
        actorType: "ADMIN",
        actorId: admin.id,
        action: "cms_page.updated",
        entityType: "CmsPage",
        entityId: pageId,
        outcome: "SUCCESS",
        summary: `Page "${data.title}" edited by ${admin.email}`,
      }),
    ]);
    revalidatePath("/admin/cms");
    revalidatePath(`/admin/cms/${pageId}`);
    revalidatePath(`/${existing.slug}`);
    if (existing.slug !== data.slug) revalidatePath(`/${data.slug}`);
    // Title/slug edits on an already-published page change what the
    // sitemap should list (or its old URL, on a slug rename) — revalidated
    // unconditionally rather than checking status here, since getting this
    // wrong only costs one extra cheap regeneration, not a correctness risk.
    revalidatePath("/sitemap.xml");
    return { status: "success" as const };
  } catch (err) {
    if (isUniqueConstraintError(err, "slug")) {
      return { status: "error" as const, message: "That slug is already in use." };
    }
    throw err;
  }
}

export async function publishCmsPage(pageId: string) {
  const admin = await requireAdminRole("ADMIN");
  const page = await prisma.cmsPage.findUniqueOrThrow({ where: { id: pageId } });

  await prisma.$transaction([
    prisma.cmsPage.update({
      where: { id: pageId },
      data: { status: "PUBLISHED", publishedAt: page.publishedAt ?? new Date() },
    }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: admin.id,
      action: "cms_page.published",
      entityType: "CmsPage",
      entityId: pageId,
      outcome: "SUCCESS",
      beforeValue: page.status,
      afterValue: "PUBLISHED",
      summary: `Page "${page.title}" published by ${admin.email}`,
    }),
  ]);
  revalidatePath("/admin/cms");
  revalidatePath(`/${page.slug}`);
  // Phase M SEO audit: app/sitemap.ts now queries published CmsPage rows
  // directly, so its cached output goes stale exactly like any other public
  // page unless revalidated here too.
  revalidatePath("/sitemap.xml");
}

export async function unpublishCmsPage(pageId: string) {
  const admin = await requireAdminRole("ADMIN");
  const page = await prisma.cmsPage.findUniqueOrThrow({ where: { id: pageId } });

  await prisma.$transaction([
    prisma.cmsPage.update({ where: { id: pageId }, data: { status: "UNPUBLISHED" } }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: admin.id,
      action: "cms_page.unpublished",
      entityType: "CmsPage",
      entityId: pageId,
      outcome: "SUCCESS",
      beforeValue: page.status,
      afterValue: "UNPUBLISHED",
      summary: `Page "${page.title}" unpublished by ${admin.email}`,
    }),
  ]);
  revalidatePath("/admin/cms");
  revalidatePath(`/${page.slug}`);
  revalidatePath("/sitemap.xml");
}

export type SectionInput = { id?: string; type: string; sortOrder: number; content: unknown };

// Replaces the FULL ordered set of a page's sections in one transaction —
// simpler and safer than diffing an incoming list against existing rows
// (no risk of a partially-applied reorder), at the cost of re-creating
// every row's id on every save. Acceptable: nothing else references a
// CmsPageSection by id outside of this page's own edit screen.
export async function saveCmsPageSections(pageId: string, sections: SectionInput[]) {
  const admin = await requireAdminRole("EDITOR");

  if (!Array.isArray(sections) || sections.length > 50) {
    return { status: "error" as const, message: "Too many sections." };
  }

  for (const section of sections) {
    if (!SECTION_TYPES.includes(section.type as (typeof SECTION_TYPES)[number])) {
      return { status: "error" as const, message: `Unsupported section type: ${section.type}` };
    }
    const result = validateSectionContent(section.content);
    if (!result.ok) {
      return { status: "error" as const, message: result.message };
    }
  }

  const page = await prisma.cmsPage.findUniqueOrThrow({ where: { id: pageId } });

  await prisma.$transaction([
    prisma.cmsPageSection.deleteMany({ where: { pageId } }),
    prisma.cmsPageSection.createMany({
      data: sections.map((section, index) => ({
        pageId,
        type: section.type,
        sortOrder: section.sortOrder ?? index,
        content: section.content as object,
      })),
    }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: admin.id,
      action: "cms_page.updated",
      entityType: "CmsPage",
      entityId: pageId,
      outcome: "SUCCESS",
      summary: `Page "${page.title}" sections saved by ${admin.email} (${sections.length} section(s))`,
    }),
  ]);

  revalidatePath(`/admin/cms/${pageId}`);
  revalidatePath(`/${page.slug}`);
  return { status: "success" as const };
}

const createBlogPostSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).optional(),
});

export async function createBlogPost(formData: FormData) {
  const admin = await requireAdminRole("EDITOR");

  const parsed = createBlogPostSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    excerpt: formData.get("excerpt") || undefined,
  });
  if (!parsed.success) {
    return { status: "error" as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    const [post] = await prisma.$transaction([
      prisma.blogPost.create({
        data: {
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          bodyRichText: { type: "doc", content: [] },
          authorId: admin.id,
        },
      }),
      auditEventQuery({
        actorType: "ADMIN",
        actorId: admin.id,
        action: "blog_post.created",
        entityType: "BlogPost",
        entityId: data.slug,
        outcome: "SUCCESS",
        summary: `Blog post "${data.title}" created as DRAFT by ${admin.email}`,
      }),
    ]);
    revalidatePath("/admin/cms/blog");
    return { status: "success" as const, postId: post.id };
  } catch (err) {
    if (isUniqueConstraintError(err, "slug")) {
      return { status: "error" as const, message: "That slug is already in use." };
    }
    throw err;
  }
}

const updateBlogPostSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).optional(),
  // seoTitle/seoDescription already exist on the BlogPost model and are
  // already read by the public blog post's generateMetadata
  // (app/(site)/blog/[slug]/page.tsx) — this form simply hadn't ever been
  // given fields to set them, so they were permanently unreachable despite
  // the backend fully supporting them.
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(300).optional(),
});

export async function updateBlogPost(postId: string, formData: FormData) {
  const admin = await requireAdminRole("EDITOR");
  const existing = await prisma.blogPost.findUniqueOrThrow({ where: { id: postId } });

  const parsed = updateBlogPostSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    excerpt: formData.get("excerpt") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
  });
  if (!parsed.success) {
    return { status: "error" as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    await prisma.$transaction([
      prisma.blogPost.update({
        where: { id: postId },
        data: {
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
        },
      }),
      auditEventQuery({
        actorType: "ADMIN",
        actorId: admin.id,
        action: "blog_post.updated",
        entityType: "BlogPost",
        entityId: postId,
        outcome: "SUCCESS",
        summary: `Blog post "${data.title}" edited by ${admin.email}`,
      }),
    ]);
    revalidatePath("/admin/cms/blog");
    revalidatePath(`/admin/cms/blog/${postId}`);
    revalidatePath(`/blog/${existing.slug}`);
    if (existing.slug !== data.slug) revalidatePath(`/blog/${data.slug}`);
    revalidatePath("/blog");
    revalidatePath("/sitemap.xml");
    return { status: "success" as const };
  } catch (err) {
    if (isUniqueConstraintError(err, "slug")) {
      return { status: "error" as const, message: "That slug is already in use." };
    }
    throw err;
  }
}

// Mirrors saveCmsPageSections's validation (same validateSectionContent —
// it checks "is this a valid Tiptap doc," nothing section-specific), but
// BlogPost.bodyRichText is a single Json field, not a list of rows, so this
// is a plain update rather than a deleteMany/createMany replace.
export async function saveBlogPostBody(postId: string, content: unknown) {
  const admin = await requireAdminRole("EDITOR");

  const result = validateSectionContent(content);
  if (!result.ok) {
    return { status: "error" as const, message: result.message };
  }

  const post = await prisma.blogPost.findUniqueOrThrow({ where: { id: postId } });

  await prisma.$transaction([
    prisma.blogPost.update({ where: { id: postId }, data: { bodyRichText: content as object } }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: admin.id,
      action: "blog_post.updated",
      entityType: "BlogPost",
      entityId: postId,
      outcome: "SUCCESS",
      summary: `Blog post "${post.title}" body saved by ${admin.email}`,
    }),
  ]);

  revalidatePath(`/admin/cms/blog/${postId}`);
  revalidatePath(`/blog/${post.slug}`);
  return { status: "success" as const };
}

export async function publishBlogPost(postId: string) {
  const admin = await requireAdminRole("ADMIN");
  const post = await prisma.blogPost.findUniqueOrThrow({ where: { id: postId } });

  await prisma.$transaction([
    prisma.blogPost.update({
      where: { id: postId },
      data: { status: "PUBLISHED", publishedAt: post.publishedAt ?? new Date() },
    }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: admin.id,
      action: "blog_post.published",
      entityType: "BlogPost",
      entityId: postId,
      outcome: "SUCCESS",
      beforeValue: post.status,
      afterValue: "PUBLISHED",
      summary: `Blog post "${post.title}" published by ${admin.email}`,
    }),
  ]);
  revalidatePath("/admin/cms/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
}

export async function unpublishBlogPost(postId: string) {
  const admin = await requireAdminRole("ADMIN");
  const post = await prisma.blogPost.findUniqueOrThrow({ where: { id: postId } });

  await prisma.$transaction([
    prisma.blogPost.update({ where: { id: postId }, data: { status: "UNPUBLISHED" } }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: admin.id,
      action: "blog_post.unpublished",
      entityType: "BlogPost",
      entityId: postId,
      outcome: "SUCCESS",
      beforeValue: post.status,
      afterValue: "UNPUBLISHED",
      summary: `Blog post "${post.title}" unpublished by ${admin.email}`,
    }),
  ]);
  revalidatePath("/admin/cms/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
}
