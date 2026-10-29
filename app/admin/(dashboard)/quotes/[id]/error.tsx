"use client";

import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

export default function QuoteDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorPanel error={error} reset={reset} backHref="/admin/quotes" backLabel="Back to Quotes" />;
}
