import type { Metadata } from "next";
import { ErrorRecovery } from "@/components/ErrorRecovery";

// Plain "Page not found" — the root layout's title template ("%s | Moira
// Events") already appends the brand name; adding it here too produced
// "Page not found | Moira Events | Moira Events" (confirmed via a live
// request during the Phase M SEO audit).
export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <ErrorRecovery
      title="Page Not Found"
      message="The page you're looking for doesn't exist or may have moved."
    />
  );
}
