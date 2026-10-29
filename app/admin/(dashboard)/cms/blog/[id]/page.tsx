import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogPostById } from "@/lib/cms/data";
import { requireAdminRole } from "@/lib/admin/auth";
import { EditBlogPostForm } from "./EditBlogPostForm";
import { BlogBodyEditor } from "./BlogBodyEditor";
import { BlogPublishControls } from "./BlogPublishControls";

export const metadata: Metadata = { title: "Edit Blog Post — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminEditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminRole("EDITOR");
  const { id } = await params;

  const post = await getBlogPostById(id);
  if (!post) notFound();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-espresso-700">{post.title}</h1>
        <p className="text-xs text-ink/50">
          /blog/{post.slug} &middot; {post.status} &middot; last updated {post.updatedAt.toLocaleString()}
          {post.author?.email ? ` by ${post.author.email}` : ""}
        </p>
      </div>

      {admin.role === "ADMIN" && <BlogPublishControls postId={post.id} status={post.status} />}
      {admin.role !== "ADMIN" && (
        <p className="rounded-md bg-ivory-100 px-3 py-2 text-xs text-ink/60">
          Only an administrator can publish or unpublish this post. Save your draft and ask an admin to publish it.
        </p>
      )}

      <section className="space-y-4 rounded-lg border border-espresso-100 p-5">
        <h2 className="font-serif text-lg text-espresso-700">Post details</h2>
        <EditBlogPostForm
          postId={post.id}
          initialTitle={post.title}
          initialSlug={post.slug}
          initialExcerpt={post.excerpt ?? ""}
          initialSeoTitle={post.seoTitle ?? ""}
          initialSeoDescription={post.seoDescription ?? ""}
        />
      </section>

      <section className="space-y-4 rounded-lg border border-espresso-100 p-5">
        <h2 className="font-serif text-lg text-espresso-700">Body</h2>
        <BlogBodyEditor postId={post.id} initialContent={post.bodyRichText} />
      </section>
    </div>
  );
}
