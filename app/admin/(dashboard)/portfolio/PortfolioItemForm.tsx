"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortfolioItem, updatePortfolioItem } from "@/lib/site-images/actions";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type FormState = { status: "idle" | "error" | "success"; message?: string; itemId?: string };
const initialState: FormState = { status: "idle" };

const EVENT_TYPES = [
  { value: "WEDDING", label: "Wedding" },
  { value: "PARTY", label: "Party & Social Event" },
  { value: "CORPORATE", label: "Corporate Event" },
] as const;

export function PortfolioItemForm({
  itemId,
  initial,
}: {
  itemId?: string;
  initial?: {
    title: string;
    eventType: string;
    guestCount: number | null;
    venueOrCity: string | null;
    story: string | null;
    imageUrl: string | null;
    alt: string | null;
    sortOrder: number;
  };
}) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [alt, setAlt] = useState(initial?.alt ?? "");

  const action = async (_prev: FormState, formData: FormData): Promise<FormState> => {
    if (itemId) return updatePortfolioItem(itemId, formData);
    return createPortfolioItem(formData);
  };
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!itemId && state.status === "success" && state.itemId) {
      router.push(`/admin/portfolio/${state.itemId}`);
    }
  }, [itemId, state, router]);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label className="field-label" htmlFor="title">
            Title
          </label>
          <input className="field-input" id="title" name="title" required maxLength={200} defaultValue={initial?.title} />
        </div>
        <div>
          <label className="field-label" htmlFor="eventType">
            Event type
          </label>
          <select className="field-input" id="eventType" name="eventType" defaultValue={initial?.eventType ?? "WEDDING"}>
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="guestCount">
              Guest count (optional)
            </label>
            <input
              className="field-input"
              id="guestCount"
              name="guestCount"
              type="number"
              min={0}
              max={100000}
              defaultValue={initial?.guestCount ?? undefined}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="venueOrCity">
              Venue / city (optional)
            </label>
            <input className="field-input" id="venueOrCity" name="venueOrCity" maxLength={200} defaultValue={initial?.venueOrCity ?? ""} />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="story">
            Story (optional)
          </label>
          <textarea className="field-input" id="story" name="story" maxLength={2000} rows={5} defaultValue={initial?.story ?? ""} />
        </div>
        <div>
          <label className="field-label" htmlFor="sortOrder">
            Sort order
          </label>
          <input className="field-input" id="sortOrder" name="sortOrder" type="number" defaultValue={initial?.sortOrder ?? 0} />
          <p className="mt-1 text-xs text-ink/50">Lower numbers appear first in the public gallery.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <span className="field-label">Photo</span>
          <ImageUploadField
            imageUrl={imageUrl}
            alt={alt}
            onImageUrlChange={setImageUrl}
            onAltChange={setAlt}
            previewClassName="aspect-[16/10] w-full"
          />
          <input type="hidden" name="imageUrl" value={imageUrl} />
          <input type="hidden" name="alt" value={alt} />
        </div>
        {!imageUrl && (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-espresso-100 bg-gradient-to-br from-ivory-200 to-espresso-100">
            <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/moira-events-logo.png" alt="" className="w-1/3 max-w-[140px] opacity-20" />
            </div>
          </div>
        )}
        {state.status === "error" && (
          <p className="text-sm text-red-600" role="alert">
            {state.message}
          </p>
        )}
        {state.status === "success" && itemId && <p className="text-sm text-green-700">Saved.</p>}
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Saving..." : itemId ? "Save" : "Create (unpublished)"}
        </button>
      </div>
    </form>
  );
}
