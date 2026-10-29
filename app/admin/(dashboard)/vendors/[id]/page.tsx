import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getVendorDetail } from "@/lib/vendors/data";
import { updateVendor, setVendorActive } from "../actions";
import { requireAdminRole } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Vendor Recommendation Detail — Moira Events Admin" };
export const dynamic = "force-dynamic";

const CATEGORY_SUGGESTIONS = ["Photography", "Videography", "Catering", "Decoration", "Entertainment", "DJ", "Venue", "Transport", "Makeup", "Hair", "Cake", "Security", "Other"];

export default async function AdminVendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminRole("ADMIN");
  const { id } = await params;
  const vendor = await getVendorDetail(id);
  if (!vendor) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-espresso-700">{vendor.name}</h1>
          <p className="text-sm text-ink/60">{vendor.category || "Uncategorized"}</p>
        </div>
        {vendor.active ? (
          <span className="rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800">Active</span>
        ) : (
          <span className="rounded-full bg-ink/10 px-3 py-1.5 text-sm font-medium text-ink/60">Archived</span>
        )}
      </div>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Details</h2>
        <form action={updateVendor.bind(null, vendor.id)} className="space-y-3">
          <div>
            <label className="field-label">Name</label>
            <input className="field-input" name="name" defaultValue={vendor.name} required />
          </div>
          <div>
            <label className="field-label">Category</label>
            <input className="field-input" name="category" defaultValue={vendor.category ?? ""} list="category-suggestions" />
            <datalist id="category-suggestions">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="field-label">Description <span className="text-xs text-ink/40">(shown to clients)</span></label>
            <textarea className="field-input" name="description" rows={2} defaultValue={vendor.description ?? ""} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Contact Name</label>
              <input className="field-input" name="contactName" defaultValue={vendor.contactName ?? ""} />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input className="field-input" name="phone" defaultValue={vendor.phone ?? ""} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Email</label>
              <input className="field-input" name="email" type="email" defaultValue={vendor.email ?? ""} />
            </div>
            <div>
              <label className="field-label">Website / Instagram</label>
              <input className="field-input" name="website" defaultValue={vendor.website ?? ""} />
            </div>
          </div>
          <div>
            <label className="field-label">Address</label>
            <input className="field-input" name="address" defaultValue={vendor.address ?? ""} />
          </div>
          <div>
            <label className="field-label">Notes <span className="text-xs text-ink/40">(internal only)</span></label>
            <textarea className="field-input" name="notes" rows={2} defaultValue={vendor.notes ?? ""} />
          </div>
          <button type="submit" className="btn-primary">
            Save Changes
          </button>
        </form>

        <form action={setVendorActive.bind(null, vendor.id, !vendor.active)} className="mt-4">
          <button type="submit" className="btn-secondary">
            {vendor.active ? "Archive Recommendation" : "Reactivate Recommendation"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Recommended For</h2>
        <p className="mb-4 text-xs text-ink/40">
          Bookings this vendor has been recommended to. Editing a booking&apos;s recommendation happens from that
          booking&apos;s page.
        </p>
        {vendor.bookingRecommendations.length === 0 ? (
          <p className="text-sm text-ink/50">Not recommended to any booking yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-espresso-200 text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="py-2 pr-3">Booking</th>
                  <th className="py-2 pr-3">Client</th>
                  <th className="py-2">Service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso-100">
                {vendor.bookingRecommendations.map((bv) => (
                  <tr key={bv.id}>
                    <td className="py-2 pr-3">
                      <Link href={`/admin/bookings/${bv.booking.id}#vendors`} className="text-espresso-600 hover:underline">
                        {bv.booking.bookingNumber}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{bv.booking.client.fullName}</td>
                    <td className="py-2">{bv.serviceDescription || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
