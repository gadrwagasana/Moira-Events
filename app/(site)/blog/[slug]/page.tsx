import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RichTextRenderer } from "@/components/cms/RichTextRenderer";
import { getPublishedBlogPostBySlug } from "@/lib/cms/data";

// Mirrors app/(site)/[slug]/page.tsx's CMS-page pattern exactly:
// getPublishedBlogPostBySlug only ever returns a status: "PUBLISHED" row, so
// a DRAFT/UNPUBLISHED post is indistinguishable from a nonexistent one here,
// by construction.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: post.featuredMedia
      ? {
          images: [{ url: post.featuredMedia.url, alt: post.featuredMedia.altText || post.title }],
        }
      : undefined,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.title, href: `/blog/${post.slug}` }]} />
      <article className="section mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="font-serif text-3xl text-espresso-700">{post.title}</h1>
          {post.publishedAt && (
            <p className="mt-2 text-sm text-ink/50">
              {post.publishedAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </header>
        {post.featuredMedia && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-ivory-200">
            <Image
              src={post.featuredMedia.url}
              alt={post.featuredMedia.altText || post.title}
              fill
              sizes="(min-width: 1024px) 768px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        )}
        <RichTextRenderer content={post.bodyRichText} />
      </article>
    </>
  );
}
