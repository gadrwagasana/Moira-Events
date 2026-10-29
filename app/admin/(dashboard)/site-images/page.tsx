import type { Metadata } from "next";
import { listSiteImageSlotsForAdmin } from "@/lib/site-images/data";
import { requireAdminRole } from "@/lib/admin/auth";
import { SiteImageSlotForm } from "./SiteImageSlotForm";

export const metadata: Metadata = { title: "Site Images — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSiteImagesPage() {
  // EDITOR-or-ADMIN (minimum-permission) — matches lib/site-images/actions.ts's
  // upsertSiteImageSlot, which also only requires EDITOR.
  await requireAdminRole("EDITOR");
  const slots = await listSiteImageSlotsForAdmin();
  const missingCount = slots.filter((s) => !s.data?.imageUrl).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-espresso-700">Site Images</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Fixed image slots on the public website. {missingCount > 0 ? `${missingCount} not yet set.` : "All set."}
        </p>
      </div>

      <div className="space-y-4">
        {slots.map((slot) => (
          <SiteImageSlotForm
            key={slot.key}
            slotKey={slot.key}
            label={slot.label}
            page={slot.page}
            pageHref={slot.pageHref}
            aspectHint={slot.aspectHint}
            initial={
              slot.data
                ? {
                    imageUrl: slot.data.imageUrl,
                    alt: slot.data.alt,
                    caption: slot.data.caption,
                    focalX: slot.data.focalX,
                    focalY: slot.data.focalY,
                  }
                : null
            }
            lastUpdated={
              slot.data ? { by: slot.data.updatedBy?.email ?? null, at: slot.data.updatedAt } : null
            }
          />
        ))}
      </div>
    </div>
  );
}
