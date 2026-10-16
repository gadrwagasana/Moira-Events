import Link from "next/link";
import type { Metadata } from "next";
import { getVendorsList } from "@/lib/vendors/data";
import { createVendor } from "./actions";

export const metadata: Metadata = { title: "Vendor Recommendations — Moira Events Admin" };
export const dynamic = "force-dynamic";

const CATEGORY_SUGGESTIONS = ["Photography", "Videography", "Catering", "Decoration", "Entertainment", "DJ", "Venue", "Transport", "Makeup", "Hair", "Cake", "Security", "Other"];

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; active?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const category = params.category ?? "";
  const activeOnly = params.active === "1";

  const vendors = await getVendorsList({ q, category, activeOnly });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-espresso-700">Vendor Recommendations</h1>
        <p className="mt-1 text-sm text-ink/60">
          A catalogue of trusted vendors Moira Events recommends to clients — not a contracting or vendor-payment
          system. Clients decide and arrange directly with any vendor they choose.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="q">Search</label>
          <input className="field-input w-64" id="q" name="q" type="text" defaultValue={q} placeholder="Name, contact, email, phone" />
        </div>
        <div>
          <label className="field-label" htmlFor="category">Category</label>
          <input className="field-input w-48" id="category" name="category" type="text" defaultValue={category} list="category-suggestions" />
          <datalist id="category-suggestions">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="active" value="1" defaultChecked={activeOnly} />
          Active only
        </label>
        <button type="submit" className="btn-primary">
          Filter
        </button>
        {(q || category || activeOnly) && (
          <Link href="/admin/vendors" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {vendors.length === 0 ? (
        <p className="text-sm text-ink/60">No vendor recommendations match.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Recommended For</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-ivory-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/vendors/${v.id}`} className="font-medium text-espresso-600 hover:underline">
                      {v.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{v.category || "—"}</td>
                  <td className="px-4 py-3 text-ink/60">{v.contactName || v.email || v.phone || "—"}</td>
                  <td className="px-4 py-3">{v._count.bookingRecommendations} booking(s)</td>
                  <td className="px-4 py-3">
                    {v.active ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">Active</span>
                    ) : (
                      <span className="rounded-full bg-ink/10 px-2.5 py-1 text-xs font-medium text-ink/60">Archived</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="max-w-xl rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Add Vendor Recommendation</h2>
        <form action={createVendor} className="space-y-3">
          <div>
            <label className="field-label">Name</label>
            <input className="field-input" name="name" required />
          </div>
          <div>
            <label className="field-label">Category</label>
            <input className="field-input" name="category" list="category-suggestions" />
          </div>
          <div>
            <label className="field-label">Description <span className="text-xs text-ink/40">(shown to clients)</span></label>
            <textarea className="field-input" name="description" rows={2} placeholder="e.g. Wedding and event photography" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Contact Name</label>
              <input className="field-input" name="contactName" />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input className="field-input" name="phone" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Email</label>
              <input className="field-input" name="email" type="email" />
            </div>
            <div>
              <label className="field-label">Website / Instagram</label>
              <input className="field-input" name="website" />
            </div>
          </div>
          <div>
            <label className="field-label">Address</label>
            <input className="field-input" name="address" />
          </div>
          <div>
            <label className="field-label">Notes <span className="text-xs text-ink/40">(internal only)</span></label>
            <textarea className="field-input" name="notes" rows={2} />
          </div>
          <button type="submit" className="btn-primary">
            Add Recommendation
          </button>
        </form>
      </section>
    </div>
  );
}
