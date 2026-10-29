"use client";

import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

export default function BookingDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorPanel error={error} reset={reset} backHref="/admin/bookings" backLabel="Back to Bookings" />;
}
