"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCmsPage } from "@/lib/cms/actions";
import { generateSlugFromTitle } from "@/lib/cms/slug";

type FormState = { status: "idle" | "error" | "success"; message?: string; pageId?: string };
const initialState: FormState = { status: "idle" };

async function submitNewPage(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await createCmsPage(formData);
  return result;
}

export function NewPageForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(submitNewPage, initialState);
  const [title, setTitle] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (state.status === "success" && state.pageId) {
      router.push(`/admin/cms/${state.pageId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="title">Title</label>
        <input
          className="field-input"
          id="title"
          name="title"
          required
          maxLength={200}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(generateSlugFromTitle(e.target.value));
          }}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="slug">Slug</label>
        <input
          className="field-input"
          id="slug"
          name="slug"
          required
          pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
        />
        <p className="mt-1 text-xs text-ink/50">Lowercase letters, numbers, and hyphens only. Will be the page&apos;s URL path.</p>
      </div>
      <div>
        <label className="field-label" htmlFor="metaDescription">Meta description (optional)</label>
        <textarea className="field-input" id="metaDescription" name="metaDescription" maxLength={300} rows={2} />
      </div>
      {state.status === "error" && <p className="text-sm text-red-600" role="alert">{state.message}</p>}
      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Creating..." : "Create Draft"}
      </button>
    </form>
  );
}
