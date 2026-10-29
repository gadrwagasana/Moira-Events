"use client";

import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

export default function InvoiceDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorPanel error={error} reset={reset} backHref="/admin/invoices" backLabel="Back to Invoices" />;
}
