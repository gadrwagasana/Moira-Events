"use client";

import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

export default function PortfolioItemDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorPanel error={error} reset={reset} backHref="/admin/portfolio" backLabel="Back to Portfolio" />;
}
