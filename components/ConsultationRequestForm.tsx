"use client";

import { useActionState } from "react";
import { submitConsultationRequest } from "@/app/(site)/book-a-consultation/actions";
import { initialConsultationState } from "@/app/(site)/book-a-consultation/types";
import { RequiredMark } from "@/components/RequiredMark";

function fieldErrors(errors: Record<string, string[]> | undefined, name: string) {
  return errors?.[name]?.[0];
}

export function ConsultationRequestForm() {
  const [state, formAction, isPending] = useActionState(submitConsultationRequest, initialConsultationState);

  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-espresso-200 bg-ivory-50 p-6 text-sm text-ink/70">
        <p className="font-medium text-espresso-700">Thank you. The Moira Events team will reach out shortly to confirm your consultation.</p>
        {state.referenceNumber && <p className="mt-2">Reference: {state.referenceNumber}</p>}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="c-name">Full Name<RequiredMark /></label>
          <input
            className="field-input"
            id="c-name"
            name="name"
            type="text"
            required
            aria-invalid={!!fieldErrors(state.errors, "fullName")}
            aria-describedby={fieldErrors(state.errors, "fullName") ? "c-name-error" : undefined}
          />
          {fieldErrors(state.errors, "fullName") && (
            <p id="c-name-error" className="field-error">{fieldErrors(state.errors, "fullName")}</p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="c-email">Email<RequiredMark /></label>
          <input
            className="field-input"
            id="c-email"
            name="email"
            type="email"
            required
            aria-invalid={!!fieldErrors(state.errors, "email")}
            aria-describedby={fieldErrors(state.errors, "email") ? "c-email-error" : undefined}
          />
          {fieldErrors(state.errors, "email") && (
            <p id="c-email-error" className="field-error">{fieldErrors(state.errors, "email")}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="c-phone">Phone / WhatsApp<RequiredMark /></label>
          <input
            className="field-input"
            id="c-phone"
            name="phone"
            type="tel"
            required
            aria-invalid={!!fieldErrors(state.errors, "phone")}
            aria-describedby={fieldErrors(state.errors, "phone") ? "c-phone-error" : undefined}
          />
          {fieldErrors(state.errors, "phone") && (
            <p id="c-phone-error" className="field-error">{fieldErrors(state.errors, "phone")}</p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="c-eventType">Event Type<RequiredMark /></label>
          <select
            className="field-input"
            id="c-eventType"
            name="eventType"
            defaultValue=""
            required
            aria-invalid={!!fieldErrors(state.errors, "eventType")}
            aria-describedby={fieldErrors(state.errors, "eventType") ? "c-eventType-error" : undefined}
          >
            <option value="" disabled>
              Select event type
            </option>
            <option value="WEDDING">Wedding</option>
            <option value="PARTY">Party / Social Event</option>
            <option value="CORPORATE">Corporate Event</option>
            <option value="GENERAL">Other</option>
          </select>
          {fieldErrors(state.errors, "eventType") && (
            <p id="c-eventType-error" className="field-error">{fieldErrors(state.errors, "eventType")}</p>
          )}
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="c-method">Preferred Method</label>
        <select className="field-input" id="c-method" name="method" defaultValue="">
          <option value="">No preference</option>
          <option value="IN_PERSON">In Person</option>
          <option value="PHONE">Phone</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="VIDEO_CALL">Video Call</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="c-preferredDate">Preferred Consultation Date</label>
          <input className="field-input" id="c-preferredDate" name="preferredDate" type="date" />
        </div>
        <div>
          <label className="field-label" htmlFor="c-preferredTime">Preferred Time</label>
          <input className="field-input" id="c-preferredTime" name="preferredTime" type="time" />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="c-message">What would you like to discuss?</label>
        <textarea className="field-input" id="c-message" name="message" rows={4} />
      </div>

      <p className="text-xs text-ink/50">
        This is a consultation request — our team will confirm a time that works for both sides. Live calendar
        booking is coming in a future update.
      </p>

      {state.errors?.form && (
        <p className="form-error-banner" role="alert">{state.errors.form[0]}</p>
      )}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={isPending}>
        {isPending ? "Submitting..." : "Book a Consultation"}
      </button>
    </form>
  );
}
