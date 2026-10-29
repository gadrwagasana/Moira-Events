"use client";

import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

export default function CmsPageDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorPanel error={error} reset={reset} backHref="/admin/cms" backLabel="Back to Pages" />;
}
