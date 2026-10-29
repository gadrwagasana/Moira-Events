"use client";

import { useEffect } from "react";
import { ErrorRecovery } from "@/components/ErrorRecovery";

// Route-specific boundary — catches anything that still throws inside this
// page's Server Component render (page.tsx now guards its own data-fetch,
// but this is the backstop) without taking down the rest of the site. Next
// requires this to be a Client Component.
export default function RequestAQuoteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[request-a-quote] route error boundary:", error);
  }, [error]);

  return (
    <ErrorRecovery
      title="We hit a snag loading this form"
      message="Something went wrong while loading the quote request page. Please try again, or reach us directly and we'll get your request started right away."
      onRetry={reset}
    />
  );
}
