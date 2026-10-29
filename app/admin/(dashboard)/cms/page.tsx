import Link from "next/link";
import type { Metadata } from "next";
import { listCmsPages } from "@/lib/cms/data";
import { requireAdminRole } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Pages — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminCmsPagesListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // EDITOR-or-ADMIN (minimum-permission) — both roles may view and manage
  // drafts; publish/unpublish controls are rendered conditionally below and
  // separately re-checked, ADMIN-only, inside the Server Actions themselves.
  const admin = await requireAdminRole("EDITOR");
  const isAdmin = admin.role === "ADMIN";

  const { q = "" } = await searchParams;
  const needle = q.trim().toLowerCase();

  const pages = await listCmsPages();
  const filtered = needle
    ? pages.filter((p) => p.title.toLowerCase().includes(needle) || p.slug.toLowerCase().includes(needle))
    : pages;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-espresso-700">Pages</h1>
        <Link href="/admin/cms/new" className="btn-primary">
          New Page
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          className="field-input max-w-xs"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by title or slug..."
        />
        <button type="submit" className="btn-secondary">
          Search
        </button>
      </form>

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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/50">
                  No pages found.
                </td>
              </tr>
            )}
            {filtered.map((page) => (
              <tr key={page.id} className="border-t border-espresso-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/cms/${page.id}`} className="font-medium text-espresso-700 hover:underline">
                    {page.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink/70">/{page.slug}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      page.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : page.status === "UNPUBLISHED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-ivory-200 text-ink/60"
                    }`}
                  >
                    {page.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/50">{page.author?.email ?? "—"}</td>
                <td className="px-4 py-3 text-ink/50">{page.updatedAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
