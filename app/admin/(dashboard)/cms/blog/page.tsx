import Link from "next/link";
import type { Metadata } from "next";
import { listBlogPosts } from "@/lib/cms/data";
import { requireAdminRole } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Blog — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBlogListPage() {
  // EDITOR-or-ADMIN (minimum-permission) — matches /admin/cms's split:
  // EDITOR may create/edit drafts, publish/unpublish require ADMIN.
  const admin = await requireAdminRole("EDITOR");
  const isAdmin = admin.role === "ADMIN";

  const posts = await listBlogPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-espresso-700">Blog</h1>
        <Link href="/admin/cms/blog/new" className="btn-primary">
          New Post
        </Link>
      </div>

      {!isAdmin && (
        <p className="rounded-md bg-ivory-100 px-3 py-2 text-xs text-ink/60">
          You can create and edit drafts. Publishing and unpublishing require an administrator.
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-espresso-100">
        <table className="w-full text-sm">
          <thead className="bg-ivory-50 text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/50">
                  No blog posts yet.
                </td>
              </tr>
            )}
            {posts.map((post) => (
              <tr key={post.id} className="border-t border-espresso-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/cms/blog/${post.id}`} className="font-medium text-espresso-700 hover:underline">
                    {post.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink/70">/blog/{post.slug}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      post.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : post.status === "UNPUBLISHED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-ivory-200 text-ink/60"
                    }`}
                  >
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/50">{post.author?.email ?? "—"}</td>
                <td className="px-4 py-3 text-ink/50">{post.updatedAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
