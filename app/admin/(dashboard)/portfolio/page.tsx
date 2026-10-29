import Link from "next/link";
import type { Metadata } from "next";
import { listPortfolioItemsForAdmin } from "@/lib/site-images/data";
import { requireAdminRole } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Portfolio — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPortfolioListPage() {
  // EDITOR-or-ADMIN (minimum-permission) — matches /admin/cms's split:
  // EDITOR may create/edit drafts, publish/unpublish/delete require ADMIN.
  const admin = await requireAdminRole("EDITOR");
  const isAdmin = admin.role === "ADMIN";
  const items = await listPortfolioItemsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-espresso-700">Portfolio</h1>
        <Link href="/admin/portfolio/new" className="btn-primary">
          New Item
        </Link>
      </div>

      {!isAdmin && (
        <p className="rounded-md bg-ivory-100 px-3 py-2 text-xs text-ink/60">
          You can create and edit items. Publishing, unpublishing, and deleting require an administrator.
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-espresso-100">
        <table className="w-full text-sm">
          <thead className="bg-ivory-50 text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Event Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/50">
                  No portfolio items yet.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const missingContent = !item.imageUrl && !item.story;
              return (
                <tr key={item.id} className="border-t border-espresso-100">
                  <td className="px-4 py-3">
                    <Link href={`/admin/portfolio/${item.id}`} className="font-medium text-espresso-700 hover:underline">
                      {item.title}
                    </Link>
                    {missingContent && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Missing image &amp; story
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{item.eventType}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.published ? "bg-green-100 text-green-800" : "bg-ivory-200 text-ink/60"
                      }`}
                    >
                      {item.published ? "PUBLISHED" : "DRAFT"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/50">{item.author?.email ?? "—"}</td>
                  <td className="px-4 py-3 text-ink/50">{item.updatedAt.toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
