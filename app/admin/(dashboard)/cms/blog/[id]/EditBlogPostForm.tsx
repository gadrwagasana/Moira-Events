"use client";

import { useActionState } from "react";
import { updateBlogPost } from "@/lib/cms/actions";

type FormState = { status: "idle" | "error" | "success"; message?: string };
const initialState: FormState = { status: "idle" };

export function EditBlogPostForm({
  postId,
  initialTitle,
  initialSlug,
  initialExcerpt,
  initialSeoTitle,
  initialSeoDescription,
}: {
  postId: string;
  initialTitle: string;
  initialSlug: string;
  initialExcerpt: string;
  initialSeoTitle: string;
  initialSeoDescription: string;
}) {
  const action = async (_prev: FormState, formData: FormData): Promise<FormState> => {
    return updateBlogPost(postId, formData);
  };
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="title">
          Title
        </label>
        <input className="field-input" id="title" name="title" required maxLength={200} defaultValue={initialTitle} />
      </div>
      <div>
        <label className="field-label" htmlFor="slug">
          Slug
        </label>
        <input
          className="field-input"
          id="slug"
          name="slug"
          required
          pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
          defaultValue={initialSlug}
        />
        <p className="mt-1 text-xs text-ink/50">
          Changing this changes the post&apos;s public URL. The old URL will 404 once saved.
        </p>
      </div>
      <div>
        <label className="field-label" htmlFor="excerpt">
          Excerpt (optional)
        </label>
        <textarea className="field-input" id="excerpt" name="excerpt" maxLength={500} rows={2} defaultValue={initialExcerpt} />
      </div>
      <div className="space-y-4 rounded-lg border border-espresso-100 bg-ivory-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Search &amp; social preview (optional)</p>
        <div>
          <label className="field-label" htmlFor="seoTitle">
            SEO title override
          </label>
          <input className="field-input" id="seoTitle" name="seoTitle" maxLength={200} defaultValue={initialSeoTitle} />
          <p className="mt-1 text-xs text-ink/50">Shown in search results and link previews instead of the title above. Leave blank to use the title.</p>
        </div>
        <div>
          <label className="field-label" htmlFor="seoDescription">
            SEO description override
          </label>
          <textarea
            className="field-input"
            id="seoDescription"
            name="seoDescription"
            maxLength={300}
            rows={2}
            defaultValue={initialSeoDescription}
          />
          <p className="mt-1 text-xs text-ink/50">Leave blank to use the excerpt.</p>
        </div>
      </div>
      {state.status === "error" && (
        <p className="text-sm text-red-600" role="alert">
          {state.message}
        </p>
      )}
      {state.status === "success" && <p className="text-sm text-green-700">Saved.</p>}
      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Saving..." : "Save Details"}
      </button>
    </form>
  );
}
