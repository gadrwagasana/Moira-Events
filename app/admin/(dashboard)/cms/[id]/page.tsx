import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCmsPageById } from "@/lib/cms/data";
import { requireAdminRole } from "@/lib/admin/auth";
import { EditPageForm } from "./EditPageForm";
import { SectionsEditor } from "./SectionsEditor";
import { PublishControls } from "./PublishControls";

export const metadata: Metadata = { title: "Edit Page — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminCmsEditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminRole("EDITOR");
  const { id } = await params;

  const page = await getCmsPageById(id);
  if (!page) notFound();

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-espresso-700">{page.title}</h1>
          <p className="text-xs text-ink/50">
            /{page.slug} &middot; {page.status} &middot; last updated {page.updatedAt.toLocaleString()}
            {page.author?.email ? ` by ${page.author.email}` : ""}
          </p>
        </div>
        <Link href={`/admin/cms/${page.id}/preview`} className="btn-secondary" target="_blank">
          Preview
        </Link>
      </div>

      {admin.role === "ADMIN" && <PublishControls pageId={page.id} status={page.status} />}
      {admin.role !== "ADMIN" && (
        <p className="rounded-md bg-ivory-100 px-3 py-2 text-xs text-ink/60">
          Only an administrator can publish or unpublish this page. Save your draft and ask an admin to publish it.
        </p>
      )}

      <section className="space-y-4 rounded-lg border border-espresso-100 p-5">
        <h2 className="font-serif text-lg text-espresso-700">Page details</h2>
        <EditPageForm pageId={page.id} initialTitle={page.title} initialSlug={page.slug} initialMetaDescription={page.metaDescription ?? ""} />
      </section>

      <section className="space-y-4 rounded-lg border border-espresso-100 p-5">
        <h2 className="font-serif text-lg text-espresso-700">Content sections</h2>
        <p className="text-xs text-ink/50">
          This page supports one section type for now (rich text). Sections render in the order shown.
        </p>
        <SectionsEditor
          pageId={page.id}
          initialSections={page.sections.map((s) => ({ id: s.id, type: s.type, sortOrder: s.sortOrder, content: s.content }))}
        />
      </section>
    </div>
  );
}
