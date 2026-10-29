import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCmsPageById } from "@/lib/cms/data";
import { requireAuthenticatedAdmin } from "@/lib/admin/auth";
import { RichTextRenderer } from "@/components/cms/RichTextRenderer";

export const metadata: Metadata = { title: "Preview — Moira Events Admin", robots: { index: false, follow: false } };
// force-dynamic means this is never statically generated or ISR-cached;
// combined with reading the session cookie inside requireAuthenticatedAdmin
// below, Next.js treats the whole response as fully dynamic per-request —
// the same caching posture every other authenticated admin page in this
// app already has (none of them set an explicit Cache-Control header
// either; this route is not a special case).
export const dynamic = "force-dynamic";

export default async function AdminCmsPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  // Any authenticated admin (EDITOR or ADMIN) may preview a draft — this is
  // not publish/unpublish, just viewing. Not ADMIN-gated.
  await requireAuthenticatedAdmin();
  const { id } = await params;

  const page = await getCmsPageById(id);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-10">
      <div className="rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800">
        Preview only — status: {page.status}. This is not the public page.
      </div>
      <h1 className="font-serif text-3xl text-espresso-700">{page.title}</h1>
      {page.sections.map((section) => (
        <RichTextRenderer key={section.id} content={section.content} />
      ))}
    </div>
  );
}
