"use client";

import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

export default function VendorDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorPanel error={error} reset={reset} backHref="/admin/vendors" backLabel="Back to Vendors" />;
}
