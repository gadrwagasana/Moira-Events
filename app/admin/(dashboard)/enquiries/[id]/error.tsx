"use client";

import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

export default function EnquiryDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorPanel error={error} reset={reset} backHref="/admin/enquiries" backLabel="Back to Enquiries" />;
}
