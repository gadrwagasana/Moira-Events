import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublishedCmsPageBySlug } from "@/lib/cms/data";
import { RichTextRenderer } from "@/components/cms/RichTextRenderer";

// CMS Phase 2 — the ONLY dynamic catch-all under app/(site)/. Next.js's
// router always prefers a more specific static route over this sibling
// [slug] route at the same level, so this cannot shadow or change the
// behavior of /, /about, /weddings, /services, /contact, or any other
// existing static public page — a request for any of those is resolved by
// its own page.tsx first, never reaching here. getPublishedCmsPageBySlug
// (lib/cms/data.ts) only ever returns a status: "PUBLISHED" row — a DRAFT
// or UNPUBLISHED page is indistinguishable from a nonexistent one here,
// by construction, not by an extra check that could be forgotten.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedCmsPageBySlug(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.metaDescription ?? undefined,
    alternates: { canonical: `/${page.slug}` },
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublishedCmsPageBySlug(slug);
  if (!page) notFound();

  return (
    <div className="section mx-auto max-w-3xl space-y-6">
      <h1 className="font-serif text-3xl text-espresso-700">{page.title}</h1>
      {page.sections.map((section) => (
        <RichTextRenderer key={section.id} content={section.content} />
      ))}
    </div>
  );
}
