"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/tracking/events";

export function CTAButtons({
  className = "",
  quoteLabel = "Request a Quote",
  consultLabel = "Book a Consultation",
}: {
  className?: string;
  quoteLabel?: string;
  consultLabel?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <Link
        href="/request-a-quote"
        className="btn-primary"
        onClick={() => trackEvent("primary_cta_click", { label: quoteLabel, href: "/request-a-quote" })}
      >
        {quoteLabel}
      </Link>
      <Link
        href="/book-a-consultation"
        className="btn-secondary"
        onClick={() => trackEvent("primary_cta_click", { label: consultLabel, href: "/book-a-consultation" })}
      >
        {consultLabel}
      </Link>
    </div>
  );
}
