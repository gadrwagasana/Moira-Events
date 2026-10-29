"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishPortfolioItem, unpublishPortfolioItem, deletePortfolioItem } from "@/lib/site-images/actions";

export function PortfolioPublishControls({ itemId, published }: { itemId: string; published: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: (id: string) => Promise<{ status: "success" | "error"; message?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action(itemId);
      if (result.status === "error") {
        setError(result.message ?? "Something went wrong. Please try again.");
        return;
      }
      router.refresh();
    });
  }

  function runDelete() {
    if (!confirm("Delete this portfolio item? This can't be undone.")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deletePortfolioItem(itemId);
        router.push("/admin/portfolio");
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-espresso-100 bg-ivory-50 p-4">
      {!published && (
        <button type="button" className="btn-primary" disabled={isPending} onClick={() => run(publishPortfolioItem)}>
          {isPending ? "Working..." : "Publish"}
        </button>
      )}
      {published && (
        <button type="button" className="btn-secondary" disabled={isPending} onClick={() => run(unpublishPortfolioItem)}>
          {isPending ? "Working..." : "Unpublish"}
        </button>
      )}
      <button type="button" className="text-sm font-medium text-red-600 hover:underline" disabled={isPending} onClick={runDelete}>
        Delete
      </button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
