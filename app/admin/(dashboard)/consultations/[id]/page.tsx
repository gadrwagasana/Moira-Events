import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getConsultationDetail } from "@/lib/consultations/data";
import { getValidNextStatuses } from "@/lib/consultations/transitions";
import { ConsultationMethod } from "@/lib/generated/prisma/client";
import { updateConsultationStatus, rescheduleConsultation } from "../actions";

export const metadata: Metadata = { title: "Consultation Detail — Moira Events Admin" };
export const dynamic = "force-dynamic";

function dateInputValue(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function timeInputValue(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(11, 16);
}

export default async function AdminConsultationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const consultation = await getConsultationDetail(id);
  if (!consultation) notFound();

  const { client } = consultation;
  const isFinal = consultation.status === "COMPLETED" || consultation.status === "CANCELLED";
  const nextStatuses = getValidNextStatuses(consultation.status);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-1">{consultation.referenceNumber}</p>
          <h1 className="font-serif text-2xl text-espresso-700">Consultation for {client.fullName}</h1>
          <p className="text-sm text-ink/60">Requested {consultation.createdAt.toLocaleString()}</p>
        </div>
        <span className="rounded-full bg-espresso-100 px-3 py-1.5 text-sm font-medium text-espresso-700">
          {consultation.status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Client</h2>
          <dl className="space-y-1 text-sm">
            <Row label="Name" value={client.fullName} />
            <Row label="Email" value={client.email} />
            <Row label="Phone" value={client.phone} />
            <Row label="WhatsApp" value={client.whatsapp} />
          </dl>
        </section>

        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Request Details</h2>
          <dl className="space-y-1 text-sm">
            <Row label="Event Type" value={consultation.eventType ?? undefined} />
            <Row
              label="Preferred Date"
              value={consultation.preferredDate ? new Date(consultation.preferredDate).toLocaleString() : undefined}
            />
            <Row label="Preferred Method" value={consultation.method?.replaceAll("_", " ")} />
          </dl>
          {consultation.notes && (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Client Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">{consultation.notes}</p>
            </div>
          )}
        </section>
      </div>

      {/* Scheduling */}
      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Scheduling</h2>
        <p className="mb-4 text-sm text-ink/70">
          Scheduled Date:{" "}
          <span className="font-medium text-ink">
            {consultation.scheduledDate ? new Date(consultation.scheduledDate).toLocaleString() : "Not yet scheduled"}
          </span>
        </p>

        {isFinal ? (
          <p className="text-xs text-ink/40">
            This consultation is in a final state — it can no longer be rescheduled.
          </p>
        ) : (
          <form action={rescheduleConsultation.bind(null, consultation.id)} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="field-label">Date</label>
                <input
                  className="field-input"
                  type="date"
                  name="scheduledDate"
                  required
                  defaultValue={dateInputValue(consultation.scheduledDate)}
                />
              </div>
              <div>
                <label className="field-label">Time <span className="text-xs text-ink/40">(optional)</span></label>
                <input
                  className="field-input"
                  type="time"
                  name="scheduledTime"
                  defaultValue={timeInputValue(consultation.scheduledDate)}
                />
              </div>
              <div>
                <label className="field-label">Method <span className="text-xs text-ink/40">(optional)</span></label>
                <select className="field-input" name="method" defaultValue={consultation.method ?? ""}>
                  <option value="">Keep current</option>
                  {Object.values(ConsultationMethod).map((m) => (
                    <option key={m} value={m}>
                      {m.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field-input" name="changedBy" placeholder="Changed by (optional)" />
              <input className="field-input" name="note" placeholder="Note (optional)" />
            </div>
            <button type="submit" className="btn-primary">
              Save Schedule
            </button>
          </form>
        )}
      </section>

      {/* Status */}
      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Status</h2>
        {nextStatuses.length === 0 ? (
          <p className="text-sm text-ink/50">This consultation is in a final state — no further status changes.</p>
        ) : (
          <form action={updateConsultationStatus.bind(null, consultation.id)} className="space-y-3">
            <select name="status" defaultValue={nextStatuses[0]} className="field-input w-auto">
              {nextStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field-input" name="changedBy" placeholder="Changed by (optional)" />
              <input className="field-input" name="note" placeholder="Note (optional)" />
            </div>
            <button type="submit" className="btn-primary">
              Update Status
            </button>
          </form>
        )}
      </section>

      {/* Status history */}
      {consultation.statusHistory.length > 0 && (
        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Status History</h2>
          <ul className="space-y-3 text-sm">
            {consultation.statusHistory.map((h) => (
              <li key={h.id} className="border-t border-espresso-100 pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-center gap-2 text-xs text-ink/50">
                  <span className="rounded-full bg-espresso-100 px-2 py-0.5 font-medium text-espresso-700">
                    {h.previousStatus ? h.previousStatus.replaceAll("_", " ") : "—"} → {h.newStatus.replaceAll("_", " ")}
                  </span>
                  <span>{h.changedBy ?? "—"}</span>
                  <span>{h.createdAt.toLocaleString()}</span>
                </div>
                {h.note && <p className="mt-1 text-ink/80">{h.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/50">{label}</dt>
      <dd className="text-right text-ink/80">{value || "—"}</dd>
    </div>
  );
}
