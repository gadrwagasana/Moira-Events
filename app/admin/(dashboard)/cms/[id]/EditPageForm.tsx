"use client";

import { useActionState } from "react";
import { updateCmsPage } from "@/lib/cms/actions";

type FormState = { status: "idle" | "error" | "success"; message?: string };
const initialState: FormState = { status: "idle" };

export function EditPageForm({
  pageId,
  initialTitle,
  initialSlug,
  initialMetaDescription,
}: {
  pageId: string;
  initialTitle: string;
  initialSlug: string;
  initialMetaDescription: string;
}) {
  const action = async (_prev: FormState, formData: FormData): Promise<FormState> => {
    const result = await updateCmsPage(pageId, formData);
    return result;
  };
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="title">Title</label>
        <input className="field-input" id="title" name="title" required maxLength={200} defaultValue={initialTitle} />
      </div>
      <div>
        <label className="field-label" htmlFor="slug">Slug</label>
        <input
          className="field-input"
          id="slug"
          name="slug"
          required
          pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
          defaultValue={initialSlug}
        />
        <p className="mt-1 text-xs text-ink/50">
          Changing this changes the page&apos;s public URL. The old URL will 404 once saved.
        </p>
      </div>
      <div>
        <label className="field-label" htmlFor="metaDescription">Meta description (optional)</label>
        <textarea
          className="field-input"
          id="metaDescription"
          name="metaDescription"
          maxLength={300}
          rows={2}
          defaultValue={initialMetaDescription}
        />
      </div>
      {state.status === "error" && <p className="text-sm text-red-600" role="alert">{state.message}</p>}
      {state.status === "success" && <p className="text-sm text-green-700">Saved.</p>}
      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Saving..." : "Save Details"}
      </button>
    </form>
  );
}
