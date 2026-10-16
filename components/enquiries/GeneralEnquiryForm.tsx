"use client";

import { useActionState, useEffect, useState } from "react";
import { submitGeneralEnquiry } from "@/app/(site)/request-a-quote/actions";
import { initialGeneralEnquiryState } from "@/app/(site)/request-a-quote/types";
import { siteConfig } from "@/lib/content/config";
import { divisions } from "@/lib/content/divisions";
import { RequiredMark } from "@/components/RequiredMark";
import { trackEvent } from "@/lib/tracking/events";

type ServiceOption = { id: string; name: string };
type Division = "PARTY" | "CORPORATE" | "GENERAL";

const partyCategories = divisions.find((d) => d.slug === "parties-social-events")!.categories;
const corporateCategories = divisions.find((d) => d.slug === "corporate-events")!.categories;

function fieldErrors(errors: Record<string, string[]> | undefined, name: string) {
  return errors?.[name]?.[0];
}

export function GeneralEnquiryForm({
  defaultDivision,
  partyServices,
  corporateServices,
}: {
  defaultDivision: Division;
  partyServices: ServiceOption[];
  corporateServices: ServiceOption[];
}) {
  const [state, formAction, isPending] = useActionState(submitGeneralEnquiry, initialGeneralEnquiryState);
  const [division, setDivision] = useState<Division>(defaultDivision);
  const [showOtherNote, setShowOtherNote] = useState(false);

  useEffect(() => {
    if (state.status === "success") {
      trackEvent("enquiry_submitted", { form: "general" });
    }
  }, [state.status]);

  useEffect(() => {
    if (state.errors?.form) {
      trackEvent("enquiry_submission_failed", { form: "general" });
    }
  }, [state.errors?.form]);

  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-espresso-200 bg-ivory-50 p-8 text-center">
        <p className="label-eyebrow mb-3">Request Received</p>
        <h2 className="font-serif text-2xl text-espresso-700">We&rsquo;ve Received Your Request</h2>
        <p className="mt-4 text-ink/70">
          Thank you for choosing Moira Events. Our team will review your event requirements and contact you
          regarding the next steps.
        </p>
        <dl className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-ink/80">
          <div className="flex justify-between gap-4">
            <dt className="font-medium">Reference Number</dt>
            <dd>{state.referenceNumber}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="font-medium">Submitted</dt>
            <dd>{state.submittedAt ? new Date(state.submittedAt).toLocaleString() : "—"}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs text-ink/50">
          Questions in the meantime? Reach us at{" "}
          <a href={`mailto:${siteConfig.email}`} className="underline">
            {siteConfig.email}
          </a>{" "}
          or{" "}
          <a href={`https://wa.me/${siteConfig.whatsappNumber}`} target="_blank" rel="noreferrer" className="underline">
            WhatsApp
          </a>
          .
        </p>
      </div>
    );
  }

  const services = division === "PARTY" ? partyServices : division === "CORPORATE" ? corporateServices : [];
  const categories = division === "PARTY" ? partyCategories : division === "CORPORATE" ? corporateCategories : [];

  return (
    <form action={formAction} className="space-y-8">
      {state.errors?.form && (
        <p className="form-error-banner" role="alert">{state.errors.form[0]}</p>
      )}

      <fieldset className="space-y-4">
        <legend className="label-eyebrow mb-2">What are you planning?</legend>
        <select
          className="field-input"
          name="division"
          value={division}
          onChange={(e) => setDivision(e.target.value as Division)}
        >
          <option value="PARTY">Party / Social Event</option>
          <option value="CORPORATE">Corporate Event</option>
          <option value="GENERAL">Other</option>
        </select>
        <p className="text-xs text-ink/50">Planning a wedding? Visit the dedicated Weddings page instead.</p>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="label-eyebrow mb-2">Contact Information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="fullName">Full Name<RequiredMark /></label>
            <input
              className="field-input"
              id="fullName"
              name="fullName"
              type="text"
              required
              aria-invalid={!!fieldErrors(state.errors, "fullName")}
              aria-describedby={fieldErrors(state.errors, "fullName") ? "fullName-error" : undefined}
            />
            {fieldErrors(state.errors, "fullName") && (
              <p id="fullName-error" className="field-error">{fieldErrors(state.errors, "fullName")}</p>
            )}
          </div>
          <div>
            <label className="field-label" htmlFor="email">Email<RequiredMark /></label>
            <input
              className="field-input"
              id="email"
              name="email"
              type="email"
              required
              aria-invalid={!!fieldErrors(state.errors, "email")}
              aria-describedby={fieldErrors(state.errors, "email") ? "email-error" : undefined}
            />
            {fieldErrors(state.errors, "email") && (
              <p id="email-error" className="field-error">{fieldErrors(state.errors, "email")}</p>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="phone">Phone<RequiredMark /></label>
            <input
              className="field-input"
              id="phone"
              name="phone"
              type="tel"
              required
              aria-invalid={!!fieldErrors(state.errors, "phone")}
              aria-describedby={fieldErrors(state.errors, "phone") ? "phone-error" : undefined}
            />
            {fieldErrors(state.errors, "phone") && (
              <p id="phone-error" className="field-error">{fieldErrors(state.errors, "phone")}</p>
            )}
          </div>
          <div>
            <label className="field-label" htmlFor="whatsapp">WhatsApp (optional)</label>
            <input className="field-input" id="whatsapp" name="whatsapp" type="tel" />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="preferredContactMethod">Preferred Contact Method</label>
          <select className="field-input" id="preferredContactMethod" name="preferredContactMethod" defaultValue="">
            <option value="">No preference</option>
            <option value="EMAIL">Email</option>
            <option value="PHONE">Phone</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>
      </fieldset>

      {division !== "GENERAL" && (
        <fieldset className="space-y-4">
          <legend className="label-eyebrow mb-2">Event Information</legend>
          {categories.length > 0 && (
            <div>
              <label className="field-label" htmlFor="eventSubtype">Event Type</label>
              <select className="field-input" id="eventSubtype" name="eventSubtype" defaultValue="">
                <option value="">Select event type</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="eventDate">Event Date</label>
              <input className="field-input" id="eventDate" name="eventDate" type="date" />
            </div>
            <div>
              <label className="field-label" htmlFor="estimatedGuests">Estimated Guests</label>
              <input className="field-input" id="estimatedGuests" name="estimatedGuests" type="number" min={1} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="location">Location</label>
            <input className="field-input" id="location" name="location" type="text" />
          </div>
        </fieldset>
      )}

      {services.length > 0 && (
        <fieldset className="space-y-4">
          <legend className="label-eyebrow mb-2">Services</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {services.map((svc) => (
              <label key={svc.id} className="flex items-center gap-2 text-sm text-ink/80">
                <input type="checkbox" name="serviceIds" value={svc.id} className="h-4 w-4 rounded border-espresso-300" />
                {svc.name}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-espresso-300"
              checked={showOtherNote}
              onChange={(e) => setShowOtherNote(e.target.checked)}
            />
            Other — not listed above
          </label>
          {showOtherNote && (
            <div>
              <label className="field-label" htmlFor="otherServicesNote">Please describe what you need</label>
              <textarea className="field-input" id="otherServicesNote" name="otherServicesNote" rows={3} />
            </div>
          )}
        </fieldset>
      )}

      <fieldset className="space-y-4">
        <legend className="label-eyebrow mb-2">Budget</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="budgetAmount">Estimated Budget</label>
            <input className="field-input" id="budgetAmount" name="budgetAmount" type="number" min={0} />
          </div>
          <div>
            <label className="field-label" htmlFor="budgetCurrency">Currency</label>
            <select className="field-input" id="budgetCurrency" name="budgetCurrency" defaultValue="RWF">
              <option value="RWF">RWF</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="label-eyebrow mb-2">Message</legend>
        <div>
          <label className="field-label" htmlFor="message">Tell us about your event<RequiredMark /></label>
          <textarea
            className="field-input"
            id="message"
            name="message"
            rows={4}
            required
            aria-invalid={!!fieldErrors(state.errors, "message")}
            aria-describedby={fieldErrors(state.errors, "message") ? "message-error" : undefined}
          />
          {fieldErrors(state.errors, "message") && (
            <p id="message-error" className="field-error">{fieldErrors(state.errors, "message")}</p>
          )}
        </div>
      </fieldset>

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={isPending}>
        {isPending ? "Submitting..." : "Request My Quote"}
      </button>
    </form>
  );
}
