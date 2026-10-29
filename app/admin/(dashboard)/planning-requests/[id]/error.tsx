"use client";

import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

export default function PlanningRequestDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AdminErrorPanel error={error} reset={reset} backHref="/admin/planning-requests" backLabel="Back to Planning Requests" />
  );
}
