"use client";

import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

export default function ConsultationDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorPanel error={error} reset={reset} backHref="/admin/consultations" backLabel="Back to Consultations" />;
}
