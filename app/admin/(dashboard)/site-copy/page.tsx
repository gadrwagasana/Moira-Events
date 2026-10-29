import type { Metadata } from "next";
import { listSiteCopyForAdmin } from "@/lib/site-copy/data";
import { SITE_COPY_SLOTS } from "@/lib/site-copy/keys";
import { requireAdminRole } from "@/lib/admin/auth";
import { SiteCopyFieldForm } from "./SiteCopyFieldForm";

export const metadata: Metadata = { title: "Site Copy — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSiteCopyPage() {
  // EDITOR-or-ADMIN (minimum-permission) — matches lib/site-copy/actions.ts's
  // upsertSiteCopy, which also only requires EDITOR.
  await requireAdminRole("EDITOR");
  const rows = await listSiteCopyForAdmin();
  const byKey = new Map(rows.map((r) => [r.key, r.data]));

  // Grouped by page (Homepage, About, …) rather than one flat list — each
  // new page's fields get added to SITE_COPY_SLOTS in lib/site-copy/keys.ts
  // and automatically appear under their own heading here, no change needed
  // in this file.
  const pages = [...new Set(SITE_COPY_SLOTS.map((s) => s.page))];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-2xl text-espresso-700">Site Copy</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Editable text on existing website pages. Leave a field blank to use its default wording.
        </p>
      </div>

      {pages.map((page) => (
        <div key={page} className="space-y-4">
          <h2 className="font-serif text-lg text-espresso-700">{page === "Homepage" ? "Homepage" : `${page} Page`}</h2>
          {SITE_COPY_SLOTS.filter((s) => s.page === page).map((slot) => {
            const data = byKey.get(slot.key);
            return (
              <SiteCopyFieldForm
                key={slot.key}
                copyKey={slot.key}
                label={slot.label}
                page={slot.page}
                pageHref={slot.pageHref}
                maxLength={slot.maxLength}
                defaultValue={slot.default}
                initialValue={data?.value ?? null}
                lastUpdated={data ? { by: data.updatedBy?.email ?? null, at: data.updatedAt } : null}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
