"use client";

import { useActionState, useState } from "react";
import { updateSiteSettings } from "@/lib/settings/actions";

type FormState = { status: "idle" | "error" | "success"; message?: string };
const initialState: FormState = { status: "idle" };

const TABS = ["Brand", "Contact", "Social", "CTAs"] as const;
type Tab = (typeof TABS)[number];

export type SettingsFormInitial = {
  siteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  phoneE164: string | null;
  contactEmail: string | null;
  whatsappNumber: string | null;
  addressLine: string | null;
  city: string | null;
  openingHours: string | null;
  googleMapsUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  primaryCtaLabel: string | null;
  primaryCtaHref: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
};

export function SettingsForm({ initial }: { initial: SettingsFormInitial }) {
  const [tab, setTab] = useState<Tab>("Brand");
  const action = async (_prev: FormState, formData: FormData): Promise<FormState> => updateSiteSettings(formData);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex gap-1 rounded-lg bg-ivory-100 p-1 text-sm">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-2 font-medium transition-colors ${
              tab === t ? "bg-ivory-50 text-espresso-700 shadow-sm" : "text-ink/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={tab === "Brand" ? "space-y-4" : "hidden"}>
        <div>
          <label className="field-label" htmlFor="siteName">Site name</label>
          <input className="field-input" id="siteName" name="siteName" required maxLength={100} defaultValue={initial.siteName} />
        </div>
        <div>
          <label className="field-label" htmlFor="logoUrl">Logo URL</label>
          <input className="field-input" id="logoUrl" name="logoUrl" type="url" placeholder="https://..." defaultValue={initial.logoUrl ?? ""} />
        </div>
        <div>
          <label className="field-label" htmlFor="faviconUrl">Favicon URL</label>
          <input className="field-input" id="faviconUrl" name="faviconUrl" type="url" placeholder="https://..." defaultValue={initial.faviconUrl ?? ""} />
        </div>
      </div>

      <div className={tab === "Contact" ? "space-y-4" : "hidden"}>
        <div>
          <label className="field-label" htmlFor="phoneE164">Phone (E.164)</label>
          <input className="field-input" id="phoneE164" name="phoneE164" placeholder="+250787553323" defaultValue={initial.phoneE164 ?? ""} />
          <p className="mt-1 text-xs text-ink/50">
            Country code + number, no spaces — e.g. +250787553323. Displayed as &quot;+250 787 553 323&quot; automatically.
          </p>
        </div>
        <div>
          <label className="field-label" htmlFor="contactEmail">Email</label>
          <input className="field-input" id="contactEmail" name="contactEmail" type="email" defaultValue={initial.contactEmail ?? ""} />
        </div>
        <div>
          <label className="field-label" htmlFor="whatsappNumber">WhatsApp number</label>
          <input className="field-input" id="whatsappNumber" name="whatsappNumber" placeholder="250787553323" defaultValue={initial.whatsappNumber ?? ""} />
        </div>
        <div>
          <label className="field-label" htmlFor="addressLine">Address</label>
          <input className="field-input" id="addressLine" name="addressLine" maxLength={200} defaultValue={initial.addressLine ?? ""} />
        </div>
        <div>
          <label className="field-label" htmlFor="city">City</label>
          <input className="field-input" id="city" name="city" maxLength={100} defaultValue={initial.city ?? ""} />
        </div>
        <div>
          <label className="field-label" htmlFor="openingHours">Opening hours</label>
          <textarea className="field-input" id="openingHours" name="openingHours" rows={2} maxLength={500} defaultValue={initial.openingHours ?? ""} />
        </div>
        <div>
          <label className="field-label" htmlFor="googleMapsUrl">Google Maps link</label>
          <input className="field-input" id="googleMapsUrl" name="googleMapsUrl" type="url" placeholder="https://..." defaultValue={initial.googleMapsUrl ?? ""} />
        </div>
      </div>

      <div className={tab === "Social" ? "space-y-4" : "hidden"}>
        {([
          ["instagramUrl", "Instagram"],
          ["facebookUrl", "Facebook"],
          ["tiktokUrl", "TikTok"],
          ["linkedinUrl", "LinkedIn"],
          ["youtubeUrl", "YouTube"],
        ] as const).map(([name, label]) => (
          <div key={name}>
            <label className="field-label" htmlFor={name}>{label}</label>
            <input
              className="field-input"
              id={name}
              name={name}
              type="url"
              placeholder="https://..."
              defaultValue={initial[name] ?? ""}
            />
          </div>
        ))}
      </div>

      <div className={tab === "CTAs" ? "space-y-4" : "hidden"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="primaryCtaLabel">Primary CTA label</label>
            <input className="field-input" id="primaryCtaLabel" name="primaryCtaLabel" maxLength={60} defaultValue={initial.primaryCtaLabel ?? ""} />
          </div>
          <div>
            <label className="field-label" htmlFor="primaryCtaHref">Primary CTA link</label>
            <input className="field-input" id="primaryCtaHref" name="primaryCtaHref" maxLength={300} defaultValue={initial.primaryCtaHref ?? ""} />
          </div>
          <div>
            <label className="field-label" htmlFor="secondaryCtaLabel">Secondary CTA label</label>
            <input className="field-input" id="secondaryCtaLabel" name="secondaryCtaLabel" maxLength={60} defaultValue={initial.secondaryCtaLabel ?? ""} />
          </div>
          <div>
            <label className="field-label" htmlFor="secondaryCtaHref">Secondary CTA link</label>
            <input className="field-input" id="secondaryCtaHref" name="secondaryCtaHref" maxLength={300} defaultValue={initial.secondaryCtaHref ?? ""} />
          </div>
        </div>
      </div>

      {state.status === "error" && <p className="text-sm text-red-600" role="alert">{state.message}</p>}
      {state.status === "success" && <p className="text-sm text-green-700">Saved — the live site updates within a minute.</p>}
      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
