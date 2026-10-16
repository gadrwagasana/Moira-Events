import Link from "next/link";
import type { Metadata } from "next";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getPlanningRequestsForClient } from "@/lib/client-portal/data";
import { RequestForm } from "./RequestForm";

export const metadata: Metadata = { title: "Planning Requests — Moira Events Client Portal" };
export const dynamic = "force-dynamic";

export default async function PortalRequestsPage() {
  const clientId = await requireAuthenticatedClientId();
  const requests = await getPlanningRequestsForClient(clientId);

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl text-espresso-700">Planning Requests</h1>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-espresso-100 bg-ivory-50 p-8 text-center">
          <p className="text-sm text-ink/60">You don&apos;t have any planning requests yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-ivory-50">
                  <td className="px-4 py-3 font-medium">{r.subject}</td>
                  <td className="px-4 py-3">{r.priority}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                      {r.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{r.createdAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/portal/requests/${r.id}`} className="text-espresso-600 hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="max-w-xl rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Submit a Planning Request</h2>
        <p className="mb-4 text-xs text-ink/50">
          Let us know what you&apos;d like to change or ask about — our team will review and follow up here. This
          doesn&apos;t change anything automatically; we&apos;ll confirm with you first.
        </p>
        <RequestForm />
      </section>
    </div>
  );
}
