import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPortfolioItemById } from "@/lib/site-images/data";
import { requireAdminRole } from "@/lib/admin/auth";
import { PortfolioItemForm } from "../PortfolioItemForm";
import { PortfolioPublishControls } from "../PortfolioPublishControls";

export const metadata: Metadata = { title: "Edit Portfolio Item — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminEditPortfolioItemPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminRole("EDITOR");
  const { id } = await params;

  const item = await getPortfolioItemById(id);
  if (!item) notFound();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-espresso-700">{item.title}</h1>
        <p className="text-xs text-ink/50">
          {item.published ? "Published" : "Draft"} &middot; last updated {item.updatedAt.toLocaleString()}
          {item.author?.email ? ` by ${item.author.email}` : ""}
        </p>
      </div>

      {admin.role === "ADMIN" && <PortfolioPublishControls itemId={item.id} published={item.published} />}
      {admin.role !== "ADMIN" && (
        <p className="rounded-md bg-ivory-100 px-3 py-2 text-xs text-ink/60">
          Only an administrator can publish, unpublish, or delete this item. Save your changes and ask an admin for
          the rest.
        </p>
      )}

      <section className="space-y-4 rounded-lg border border-espresso-100 p-5">
        <PortfolioItemForm
          itemId={item.id}
          initial={{
            title: item.title,
            eventType: item.eventType,
            guestCount: item.guestCount,
            venueOrCity: item.venueOrCity,
            story: item.story,
            imageUrl: item.imageUrl,
            alt: item.alt,
            sortOrder: item.sortOrder,
          }}
        />
      </section>
    </div>
  );
}
