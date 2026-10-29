"use client";

import { useEffect } from "react";
import "./globals.css";
import { ErrorRecovery } from "@/components/ErrorRecovery";

// Last-resort boundary — only fires if the root layout itself throws, which
// is why this (uniquely among error boundaries) must render its own
// <html>/<body>, replacing the entire document rather than slotting into
// it. Deliberately doesn't depend on the custom font loader the root layout
// uses — font-serif/font-sans fall back to Georgia/system-sans (see
// app/globals.css's @theme) if the custom fonts aren't active here, which
// is an acceptable degradation for the one page that exists specifically
// because something already went more wrong than usual.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] global error boundary:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans">
        <ErrorRecovery
          title="Something went wrong"
          message="We're sorry — an unexpected error occurred. Please try again, or reach out and our team will help directly."
          onRetry={reset}
        />
      </body>
    </html>
  );
}
