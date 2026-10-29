"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishBlogPost, unpublishBlogPost } from "@/lib/cms/actions";

export function BlogPublishControls({ postId, status }: { postId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: (id: string) => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action(postId);
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-espresso-100 bg-ivory-50 p-4">
      {status !== "PUBLISHED" && (
        <button type="button" className="btn-primary" disabled={isPending} onClick={() => run(publishBlogPost)}>
          {isPending ? "Working..." : "Publish"}
        </button>
      )}
      {status === "PUBLISHED" && (
        <button type="button" className="btn-secondary" disabled={isPending} onClick={() => run(unpublishBlogPost)}>
          {isPending ? "Working..." : "Unpublish"}
        </button>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
