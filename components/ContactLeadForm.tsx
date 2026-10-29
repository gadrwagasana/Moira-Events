"use client";

import { useActionState } from "react";
import { submitContactMessage } from "@/app/(site)/contact/actions";
import { initialContactState } from "@/app/(site)/contact/types";
import { RequiredMark } from "@/components/RequiredMark";
import { Spinner } from "@/components/Spinner";

export function ContactLeadForm() {
  const [state, formAction, isPending] = useActionState(submitContactMessage, initialContactState);

  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-espresso-200 bg-ivory-50 p-6 text-sm text-ink-muted">
        <p className="font-medium text-espresso-700">Thank you for reaching out.</p>
        <p className="mt-1">The Moira Events team will get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="ct-name">Full Name<RequiredMark /></label>
          <input
            className="field-input"
            id="ct-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-invalid={!!state.errors?.fullName}
            aria-describedby={state.errors?.fullName ? "ct-name-error" : undefined}
          />
          {state.errors?.fullName && <p id="ct-name-error" className="field-error">{state.errors.fullName[0]}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="ct-email">Email<RequiredMark /></label>
          <input
            className="field-input"
            id="ct-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={!!state.errors?.email}
            aria-describedby={state.errors?.email ? "ct-email-error" : undefined}
          />
          {state.errors?.email && <p id="ct-email-error" className="field-error">{state.errors.email[0]}</p>}
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="ct-phone">Phone / WhatsApp (optional)</label>
        <input className="field-input" id="ct-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" />
      </div>

      <div>
        <label className="field-label" htmlFor="ct-message">Message<RequiredMark /></label>
        <textarea
          className="field-input"
          id="ct-message"
          name="message"
          rows={5}
          required
          aria-invalid={!!state.errors?.message}
          aria-describedby={state.errors?.message ? "ct-message-error" : undefined}
        />
        {state.errors?.message && <p id="ct-message-error" className="field-error">{state.errors.message[0]}</p>}
      </div>

      {state.errors?.form && (
        <p className="form-error-banner" role="alert">{state.errors.form[0]}</p>
      )}

      <button type="submit" className="btn-primary w-full gap-2 sm:w-auto" disabled={isPending}>
        {isPending && <Spinner />}
        {isPending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
