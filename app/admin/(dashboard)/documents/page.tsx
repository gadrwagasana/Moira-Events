import Link from "next/link";
import type { Metadata } from "next";
import { getDocumentRecordsList } from "@/lib/documents/data";
import { DocumentType } from "@/lib/generated/prisma/client";

export const metadata: Metadata = { title: "Documents — Moira Events Admin" };
export const dynamic = "force-dynamic";

const ENTITY_LINK_PREFIX: Record<DocumentType, string> = {
  QUOTE: "/admin/quotes",
  INVOICE: "/admin/invoices",
  BOOKING_CONFIRMATION: "/admin/bookings",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; reference?: string; relatedRecordId?: string }>;
}) {
  const params = await searchParams;
  const type = params.type ?? "";
  const reference = params.reference?.trim() ?? "";
  const relatedRecordId = params.relatedRecordId?.trim() ?? "";

  const documents = await getDocumentRecordsList({ type, reference, relatedRecordId });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-espresso-700">Documents</h1>
      <p className="mb-6 text-sm text-ink/60">
        A metadata log of every quote/invoice/booking-confirmation PDF generated — no file storage is configured yet
        (Stage M), so this records that a document was produced, not a copy of it. Use the links below to regenerate
        and re-download the current version via the existing on-demand routes.
      </p>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="type">Type</label>
          <select className="field-input w-auto" id="type" name="type" defaultValue={type}>
            <option value="">All</option>
            {Object.values(DocumentType).map((t) => (
              <option key={t} value={t}>
                {t.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="reference">Reference Number</label>
          <input className="field-input w-56" id="reference" name="reference" type="text" defaultValue={reference} placeholder="MQ-/MI-/MB-..." />
        </div>
        <div>
          <label className="field-label" htmlFor="relatedRecordId">Related Record Id</label>
          <input className="field-input w-56" id="relatedRecordId" name="relatedRecordId" type="text" defaultValue={relatedRecordId} />
        </div>
        <button type="submit" className="btn-primary">
          Filter
        </button>
        {(type || reference || relatedRecordId) && (
          <Link href="/admin/documents" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {documents.length === 0 ? (
        <p className="text-sm text-ink/60">No documents match.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Filename</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-ivory-50">
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                      {doc.type.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`${ENTITY_LINK_PREFIX[doc.type]}/${doc.relatedRecordId}`} className="font-medium text-espresso-600 hover:underline">
                      {doc.referenceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{doc.version ?? "—"}</td>
                  <td className="px-4 py-3 text-ink/60">{doc.filename}</td>
                  <td className="px-4 py-3 text-ink/60">{formatBytes(doc.fileSizeBytes)}</td>
                  <td className="px-4 py-3 text-ink/60">
                    {doc.actorType === "CLIENT" ? `Client (${doc.actorId})` : doc.actorType}
                  </td>
                  <td className="px-4 py-3 text-ink/60">{doc.createdAt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
