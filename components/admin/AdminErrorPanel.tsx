"use client";

import { useEffect } from "react";
import Link from "next/link";

// Shared by app/admin/(dashboard)/error.tsx and every admin [id] route's
// own error.tsx. Deliberately has no public-site chrome (no Home/WhatsApp/
// Contact links) — this only ever renders inside the admin dashboard layout,
// which already supplies the sidebar; this panel is just the <main> content.
export function AdminErrorPanel({
  error,
  reset,
  title = "This record couldn't be loaded",
  backHref,
  backLabel,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  backHref: string;
  backLabel: string;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-xl border border-espresso-100 bg-ivory-50 p-10 text-center">
      <h1 className="font-serif text-xl text-espresso-700">{title}</h1>
      <p className="max-w-md text-sm text-ink/60">
        Something went wrong loading this page. This is often a brief database connection hiccup — trying again
        usually fixes it.
      </p>
      {error.digest && <p className="font-mono text-xs text-ink/40">Digest: {error.digest}</p>}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => reset()} className="btn-primary">
          Try again
        </button>
        <Link href={backHref} className="btn-secondary">
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
