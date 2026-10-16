"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/tracking/events";

// Fires once per page load — mounted invisibly on each service/division
// page. Kept as its own tiny Client Component so the page itself (and its
// metadata/JSON-LD) can stay a Server Component.
export function ServicePageViewTracker({ page }: { page: string }) {
  useEffect(() => {
    trackEvent("service_page_view", { page });
  }, [page]);
  return null;
}
