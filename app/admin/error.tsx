"use client";

import { useEffect } from "react";
import Link from "next/link";

// Top-level admin fallback — catches an error thrown above or outside the
// (dashboard) route group (e.g. in app/admin/layout.tsx itself, or on
// /admin/login). No sidebar to keep here (this segment doesn't render one),
// unlike app/admin/(dashboard)/error.tsx, which is the one that actually
// fires for every named crash in the bug report.
export default function AdminRootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ivory-100 p-10 text-center text-ink">
      <h1 className="font-serif text-xl text-espresso-700">Something went wrong</h1>
      <p className="max-w-md text-sm text-ink/60">
        This is often a brief database connection hiccup — trying again usually fixes it.
      </p>
      {error.digest && <p className="font-mono text-xs text-ink/40">Digest: {error.digest}</p>}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => reset()} className="btn-primary">
          Try again
        </button>
        <Link href="/admin/login" className="btn-secondary">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
