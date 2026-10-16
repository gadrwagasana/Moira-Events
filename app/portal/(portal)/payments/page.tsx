import type { Metadata } from "next";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getPaymentsForClient } from "@/lib/client-portal/data";

export const metadata: Metadata = { title: "Payments — Moira Events Client Portal" };
export const dynamic = "force-dynamic";

function money(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function PortalPaymentsPage() {
  const clientId = await requireAuthenticatedClientId();
  const payments = await getPaymentsForClient(clientId);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl text-espresso-700">Payments</h1>

      {payments.length === 0 ? (
        <div className="rounded-xl border border-espresso-100 bg-ivory-50 p-8 text-center">
          <p className="text-sm text-ink/60">No payments have been recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-ivory-50">
                  <td className="px-4 py-3 text-ink/60">
                    {payment.paymentDate
                      ? new Date(payment.paymentDate).toLocaleDateString()
                      : payment.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{payment.booking.bookingNumber}</td>
                  <td className="px-4 py-3">
                    {money(payment.amount)} {payment.currency ?? ""}
                  </td>
                  <td className="px-4 py-3">{payment.method ?? "—"}</td>
                  <td className="px-4 py-3">{payment.reference || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                      {payment.status.replaceAll("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
