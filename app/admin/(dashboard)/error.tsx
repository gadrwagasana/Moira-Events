"use client";

import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

// Dashboard-wide fallback — catches an error from any page.tsx under
// app/admin/(dashboard) (list pages, analytics, etc.) that doesn't have its
// own more specific error.tsx. Lives inside the (dashboard) segment, so the
// layout.tsx that renders the sidebar stays mounted; this only replaces the
// <main> content. It canNOT catch an error thrown by layout.tsx itself
// (requireAuthenticatedAdmin / listSiteImageSlotsForAdmin) — those are
// wrapped with withDbRetry() instead, since no error boundary in this
// segment can protect against a crash in its own layout.
export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AdminErrorPanel error={error} reset={reset} backHref="/admin/enquiries" backLabel="Back to Dashboard" />;
}
