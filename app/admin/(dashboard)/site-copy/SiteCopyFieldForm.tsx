"use client";

import { useActionState } from "react";
import { upsertSiteCopy } from "@/lib/site-copy/actions";

type FormState = { status: "idle" | "error" | "success"; message?: string };
const initialState: FormState = { status: "idle" };

export function SiteCopyFieldForm({
  copyKey,
  label,
  page,
  pageHref,
  maxLength,
  defaultValue,
  initialValue,
  lastUpdated,
}: {
  copyKey: string;
  label: string;
  page: string;
  pageHref: string;
  maxLength: number;
  defaultValue: string;
  initialValue: string | null;
  lastUpdated?: { by: string | null; at: Date } | null;
}) {
  const action = async (_prev: FormState, formData: FormData): Promise<FormState> => {
    return upsertSiteCopy(copyKey, formData);
  };
  const [state, formAction, isPending] = useActionState(action, initialState);

  const isLong = maxLength > 150;
  const usingDefault = initialValue === null;

  return (
    <div className="rounded-lg border border-espresso-100 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-espresso-700">{label}</h3>
          <p className="text-xs text-ink/50">
            {page} ({pageHref})
          </p>
          {lastUpdated && (
            <p className="text-xs text-ink/40">
              Last updated {lastUpdated.at.toLocaleDateString()}
              {lastUpdated.by ? ` by ${lastUpdated.by}` : ""}
            </p>
          )}
        </div>
        {usingDefault && (
          <span className="rounded-full bg-ivory-200 px-2 py-0.5 text-xs font-medium text-ink/60">
            Using default
          </span>
        )}
      </div>

      <form action={formAction} className="mt-4 max-w-xl space-y-3">
        <div>
          <label className="field-label" htmlFor={`${copyKey}-value`}>
            Text
          </label>
          {isLong ? (
            <textarea
              className="field-input"
              id={`${copyKey}-value`}
              name="value"
              rows={3}
              maxLength={maxLength}
              placeholder={defaultValue}
              defaultValue={initialValue ?? ""}
            />
          ) : (
            <input
              className="field-input"
              id={`${copyKey}-value`}
              name="value"
              maxLength={maxLength}
              placeholder={defaultValue}
              defaultValue={initialValue ?? ""}
            />
          )}
          <p className="mt-1 text-xs text-ink/50">
            {usingDefault ? (
              <>
                Currently showing the default: <span className="italic">&ldquo;{defaultValue}&rdquo;</span>
              </>
            ) : (
              "Leave blank and save to clear this override and go back to the default."
            )}
          </p>
        </div>
        {state.status === "error" && (
          <p className="text-sm text-red-600" role="alert">
            {state.message}
          </p>
        )}
        {state.status === "success" && <p className="text-sm text-green-700">Saved.</p>}
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
