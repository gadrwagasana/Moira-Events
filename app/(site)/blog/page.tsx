import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { listPublishedBlogPosts } from "@/lib/cms/data";

export const metadata: Metadata = {
  title: "Blog",
  description: "News, updates, and planning advice from Moira Events.",
  alternates: { canonical: "/blog" },
};

export const dynamic = "force-dynamic";

export default async function BlogListPage() {
  const posts = await listPublishedBlogPosts();
  // Hidden (404, consistent with how a draft CmsPage/BlogPost is already
  // indistinguishable from nonexistent) rather than shown with an empty
  // state, while there's nothing published yet — matches the sitemap
  // change below, which also omits /blog in this state.
  if (posts.length === 0) notFound();

  return (
    <>
      <Breadcrumbs items={[{ label: "Blog", href: "/blog" }]} />
      <PageHero eyebrow="News & Updates" title="Blog" support="Planning advice and updates from the Moira Events team." />

      <section className="section">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="card-interactive focus-ring group relative flex flex-col overflow-hidden rounded-xl"
              >
                {post.featuredMedia && (
                  <div className="relative aspect-[16/10] overflow-hidden bg-ivory-200">
                    <Image
                      src={post.featuredMedia.url}
                      alt={post.featuredMedia.altText || post.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-serif text-lg text-espresso-700">{post.title}</h2>
                  {post.publishedAt && (
                    <p className="mt-1 text-xs text-ink/50">
                      {post.publishedAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  )}
                  {post.excerpt && <p className="mt-2 flex-1 text-sm text-ink-muted">{post.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
      </section>
    </>
  );
}
