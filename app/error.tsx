"use client";

import { useEffect } from "react";
import { ErrorRecovery } from "@/components/ErrorRecovery";

// Site-wide fallback for any route that doesn't have its own error.tsx and
// throws somewhere inside the root layout's tree. Does NOT catch an error
// thrown by the root layout itself — that's global-error.tsx's job.
export default function GlobalPageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] route error boundary:", error);
  }, [error]);

  return (
    <ErrorRecovery
      title="Something went wrong"
      message="We're sorry — an unexpected error occurred. Please try again, or reach out and our team will help directly."
      onRetry={reset}
    />
  );
}
