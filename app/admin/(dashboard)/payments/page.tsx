import Link from "next/link";
import type { Metadata } from "next";
import { getPaymentsList } from "@/lib/payments/data";
import { PaymentStatus } from "@/lib/generated/prisma/client";
import { requireAdminRole } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Payments — Moira Events Admin" };
export const dynamic = "force-dynamic";

function money(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; source?: string }>;
}) {
  await requireAdminRole("ADMIN");
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const source = params.source ?? "";

  const payments = await getPaymentsList({ q, status, source });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-espresso-700">Payments</h1>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="q">Search</label>
          <input
            className="field-input w-64"
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Booking number, name, email, or reference"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="status">Status</label>
          <select className="field-input w-auto" id="status" name="status" defaultValue={status}>
            <option value="">All</option>
            {Object.values(PaymentStatus).map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="source">Source</label>
          <select className="field-input w-auto" id="source" name="source" defaultValue={source}>
            <option value="">All</option>
            <option value="online">Online (Flutterwave)</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">
          Filter
        </button>
        {(q || status || source) && (
          <Link href="/admin/payments" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {payments.length === 0 ? (
        <p className="text-sm text-ink/60">No payments match.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-ivory-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/payments/${payment.id}`} className="font-medium text-espresso-600 hover:underline">
                      {payment.reference || payment.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/bookings/${payment.bookingId}`} className="text-espresso-600 hover:underline">
                      {payment.booking.bookingNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{payment.booking.client.fullName}</td>
                  <td className="px-4 py-3">
                    {money(payment.amount)} {payment.currency ?? ""}
                  </td>
                  <td className="px-4 py-3">
                    {payment.provider ? (
                      <span className="rounded-full bg-ivory-200 px-2.5 py-1 text-xs font-medium text-espresso-700">
                        Online ({payment.provider})
                      </span>
                    ) : (
                      <span className="text-xs text-ink/50">Manual</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{payment.method ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                      {payment.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/60">
                    {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink/60">{payment.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
