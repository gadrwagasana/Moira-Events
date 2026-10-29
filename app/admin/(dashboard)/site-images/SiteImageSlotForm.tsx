"use client";

import { useActionState, useState } from "react";
import { upsertSiteImageSlot } from "@/lib/site-images/actions";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type FormState = { status: "idle" | "error" | "success"; message?: string };
const initialState: FormState = { status: "idle" };

export function SiteImageSlotForm({
  slotKey,
  label,
  page,
  pageHref,
  aspectHint,
  initial,
  lastUpdated,
}: {
  slotKey: string;
  label: string;
  page: string;
  pageHref: string;
  aspectHint: string;
  initial: { imageUrl: string | null; alt: string | null; caption: string | null; focalX: number; focalY: number } | null;
  lastUpdated?: { by: string | null; at: Date } | null;
}) {
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [alt, setAlt] = useState(initial?.alt ?? "");
  const [focalX, setFocalX] = useState(initial?.focalX ?? 50);
  const [focalY, setFocalY] = useState(initial?.focalY ?? 50);

  const action = async (_prev: FormState, formData: FormData): Promise<FormState> => {
    return upsertSiteImageSlot(slotKey, formData);
  };
  const [state, formAction, isPending] = useActionState(action, initialState);

  const missing = !initial?.imageUrl;

  function handlePreviewClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setFocalX(Math.min(100, Math.max(0, x)));
    setFocalY(Math.min(100, Math.max(0, y)));
  }

  return (
    <div className="rounded-lg border border-espresso-100 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-espresso-700">{label}</h3>
          <p className="text-xs text-ink/50">
            {page} ({pageHref}) · {aspectHint}
          </p>
          {lastUpdated && (
            <p className="text-xs text-ink/40">
              Last updated {lastUpdated.at.toLocaleDateString()}
              {lastUpdated.by ? ` by ${lastUpdated.by}` : ""}
            </p>
          )}
        </div>
        {missing && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            Missing image
          </span>
        )}
      </div>

      <form action={formAction} className="mt-4 max-w-md space-y-4">
        <ImageUploadField
          imageUrl={imageUrl}
          alt={alt}
          onImageUrlChange={setImageUrl}
          onAltChange={setAlt}
          previewClassName="aspect-[4/3]"
          previewChildren={(url) => (
            <div onClick={handlePreviewClick} className="absolute inset-0 cursor-crosshair">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: `${focalX}% ${focalY}%` }}
              />
              <div
                aria-hidden="true"
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ivory-50 bg-espresso-600 shadow"
                style={{ left: `${focalX}%`, top: `${focalY}%` }}
              />
            </div>
          )}
        />
        <p className="-mt-2 text-xs text-ink/50">
          Leave the image blank to clear this slot. {imageUrl && "Click the preview above to set the focal point."}
        </p>
        <div>
          <label className="field-label" htmlFor={`${slotKey}-caption`}>
            Caption (optional)
          </label>
          <input
            className="field-input"
            id={`${slotKey}-caption`}
            name="caption"
            maxLength={200}
            defaultValue={initial?.caption ?? ""}
          />
          <p className="mt-1 text-xs text-ink/50">
            Only shown publicly when it says something the nearby heading doesn&apos;t already say.
          </p>
        </div>
        <input type="hidden" name="imageUrl" value={imageUrl} />
        <input type="hidden" name="alt" value={alt} />
        <input type="hidden" name="focalX" value={focalX} />
        <input type="hidden" name="focalY" value={focalY} />
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
