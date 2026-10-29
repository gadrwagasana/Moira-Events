"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitWeddingEnquiry } from "@/app/(site)/weddings/actions";
import { initialWeddingEnquiryState, type WeddingEnquiryState } from "@/app/(site)/weddings/types";
import { weddingEnquiryFieldConfig as f } from "@/lib/content/wedding-enquiry-fields";
import { siteConfig } from "@/lib/content/config";
import { RequiredMark } from "@/components/RequiredMark";
import { Spinner } from "@/components/Spinner";
import { trackEvent } from "@/lib/tracking/events";

// Human-readable labels for the Review & Submit summary — keyed by the
// field's `name` attribute. Select fields are read via their DOM element's
// selected option text (not FormData, which would only give the raw id
// value), so the summary shows what the user actually sees, not database
// ids.
const SUMMARY_FIELDS: { name: string; label: string; kind: "text" | "select" }[] = [
  { name: "fullName", label: "Full Name", kind: "text" },
  { name: "email", label: "Email", kind: "text" },
  { name: "phone", label: "Phone", kind: "text" },
  { name: "whatsapp", label: "WhatsApp", kind: "text" },
  { name: "weddingTypeId", label: "Wedding Type", kind: "select" },
  { name: "weddingDate", label: "Wedding Date", kind: "text" },
  { name: "location", label: "Location", kind: "text" },
  { name: "ceremonyLocation", label: "Ceremony Location", kind: "text" },
  { name: "receptionLocation", label: "Reception Location", kind: "text" },
  { name: "estimatedGuests", label: "Estimated Guests", kind: "text" },
  { name: "budgetAmount", label: "Estimated Budget", kind: "text" },
  { name: "budgetCurrency", label: "Currency", kind: "select" },
];

type ServiceOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; services: ServiceOption[] };

const steps = [
  "Your Details",
  "Wedding Details",
  "Services",
  "Budget",
  "Additional Requirements",
  "Review & Submit",
] as const;

function fieldErrors(state: WeddingEnquiryState, name: string) {
  return state.errors?.[name]?.[0];
}

export function WeddingEnquiryForm({
  weddingTypes,
  categories,
  uncategorizedServices,
}: {
  weddingTypes: { id: string; name: string }[];
  categories: CategoryOption[];
  uncategorizedServices: ServiceOption[];
}) {
  const [state, formAction, isPending] = useActionState(submitWeddingEnquiry, initialWeddingEnquiryState);
  const [currentStep, setCurrentStep] = useState(0);
  const [showOtherNote, setShowOtherNote] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<{ label: string; value: string }[]>([]);
  const [servicesSelectedCount, setServicesSelectedCount] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const startedRef = useRef(false);

  const isReviewStep = currentStep === steps.length - 1;

  // Warn before an accidental refresh/close once the user has moved past the
  // first step — this form has no field-level draft persistence (its inputs
  // are uncontrolled, validated via native checkValidity()/reportValidity()
  // rather than React state, so a full draft-recovery feature isn't a safe
  // fit here), but an unload confirmation at least prevents *accidental*
  // loss (Stage P audit finding).
  useEffect(() => {
    if (currentStep === 0) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentStep]);

  // Build a read-only summary of entered answers when the user reaches the
  // final step — read directly off the DOM since this form's fields are
  // uncontrolled (no single React state object holds every value).
  useEffect(() => {
    if (!isReviewStep || !formRef.current) return;
    const form = formRef.current;
    const data = new FormData(form);
    const summary = SUMMARY_FIELDS.map(({ name, label, kind }) => {
      if (kind === "select") {
        const el = form.querySelector<HTMLSelectElement>(`select[name="${name}"]`);
        const text = el?.selectedOptions[0]?.textContent?.trim();
        return { label, value: text ?? "" };
      }
      const value = String(data.get(name) ?? "").trim();
      return { label, value };
    }).filter((entry) => entry.value.length > 0);
    setReviewSummary(summary);
    setServicesSelectedCount(data.getAll("serviceIds").length);
  }, [isReviewStep]);

  // enquiry_submitted only fires once the server has actually confirmed the
  // save (state.status transitions to "success"), never optimistically.
  useEffect(() => {
    if (state.status === "success") {
      trackEvent("enquiry_submitted", { form: "wedding" });
    }
  }, [state.status]);

  // enquiry_submission_failed fires for a genuine server-side rejection
  // (a form-level error returned after a real submit attempt) — not for
  // client-side per-step validation, which never reaches the server action.
  useEffect(() => {
    if (state.errors?.form) {
      trackEvent("enquiry_submission_failed", { form: "wedding" });
    }
  }, [state.errors?.form]);

  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-espresso-200 bg-ivory-50 p-8 text-center">
        <p className="label-eyebrow mb-3">Request Received</p>
        <h2 className="font-serif text-2xl text-espresso-700">We&rsquo;ve Received Your Wedding Request</h2>
        <p className="mt-4 text-ink-muted">
          Thank you for choosing Moira Events. Our team will review your event requirements and contact you
          regarding the next steps.
        </p>
        <dl className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-ink/80">
          <div className="flex justify-between gap-4">
            <dt className="font-medium">Reference Number</dt>
            <dd className="min-w-0 break-words text-right">{state.referenceNumber}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="font-medium">Submitted</dt>
            <dd className="min-w-0 break-words text-right">
              {state.submittedAt ? new Date(state.submittedAt).toLocaleString() : "—"}
            </dd>
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

  function goToStep(index: number) {
    setCurrentStep(index);
    stepRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleNext() {
    const stepEl = stepRefs.current[currentStep];
    if (stepEl) {
      const inputs = stepEl.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input, select, textarea",
      );
      for (const el of inputs) {
        if (!el.checkValidity()) {
          el.reportValidity();
          return;
        }
      }
    }
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent("enquiry_started", { form: "wedding" });
    }
    trackEvent("enquiry_step_completed", { form: "wedding", step: currentStep + 1, stepLabel: steps[currentStep] });
    goToStep(Math.min(currentStep + 1, steps.length - 1));
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-10">
      <p className="label-eyebrow">
        Step {currentStep + 1} of {steps.length} — {steps[currentStep]}
      </p>
      <ol className="flex flex-wrap gap-2 text-xs font-medium">
        {steps.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => goToStep(index)}
              aria-current={index === currentStep ? "step" : undefined}
              className={`rounded-full border px-3 py-1 transition-colors ${
                index === currentStep
                  ? "border-espresso-600 bg-espresso-600 text-ivory-100"
                  : "border-espresso-200 text-espresso-500"
              }`}
            >
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {state.errors?.form && (
        <p className="form-error-banner" role="alert">{state.errors.form[0]}</p>
      )}

      {/* Step 1 — Client Information */}
      <div ref={(el) => { stepRefs.current[0] = el; }} className={currentStep === 0 ? "space-y-4" : "hidden"}>
        <h2 className="font-serif text-xl text-espresso-700">Your Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="fullName">Full Name{f.fullName.required && <RequiredMark />}</label>
            <input
              className="field-input"
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required={f.fullName.required}
              aria-invalid={!!fieldErrors(state, "fullName")}
              aria-describedby={fieldErrors(state, "fullName") ? "fullName-error" : undefined}
            />
            {fieldErrors(state, "fullName") && <p id="fullName-error" className="field-error">{fieldErrors(state, "fullName")}</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="email">Email{f.email.required && <RequiredMark />}</label>
            <input
              className="field-input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required={f.email.required}
              aria-invalid={!!fieldErrors(state, "email")}
              aria-describedby={fieldErrors(state, "email") ? "email-error" : undefined}
            />
            {fieldErrors(state, "email") && <p id="email-error" className="field-error">{fieldErrors(state, "email")}</p>}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="phone">Phone{f.phone.required && <RequiredMark />}</label>
            <input
              className="field-input"
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required={f.phone.required}
              aria-invalid={!!fieldErrors(state, "phone")}
              aria-describedby={fieldErrors(state, "phone") ? "phone-error" : undefined}
            />
            {fieldErrors(state, "phone") && <p id="phone-error" className="field-error">{fieldErrors(state, "phone")}</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="whatsapp">WhatsApp (optional)</label>
            <input className="field-input" id="whatsapp" name="whatsapp" type="tel" autoComplete="tel" inputMode="tel" required={f.whatsapp.required} />
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
      </div>

      {/* Step 2 — Wedding Information */}
      <div ref={(el) => { stepRefs.current[1] = el; }} className={currentStep === 1 ? "space-y-4" : "hidden"}>
        <h2 className="font-serif text-xl text-espresso-700">Wedding Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="weddingTypeId">Wedding Type{f.weddingTypeId.required && <RequiredMark />}</label>
            <select
              className="field-input"
              id="weddingTypeId"
              name="weddingTypeId"
              defaultValue=""
              required={f.weddingTypeId.required}
              aria-invalid={!!fieldErrors(state, "weddingTypeId")}
              aria-describedby={fieldErrors(state, "weddingTypeId") ? "weddingTypeId-error" : undefined}
            >
              <option value="" disabled>
                Select wedding type
              </option>
              {weddingTypes.map((wt) => (
                <option key={wt.id} value={wt.id}>
                  {wt.name}
                </option>
              ))}
            </select>
            {fieldErrors(state, "weddingTypeId") && (
              <p id="weddingTypeId-error" className="field-error">{fieldErrors(state, "weddingTypeId")}</p>
            )}
          </div>
          <div>
            <label className="field-label" htmlFor="weddingDate">Wedding Date</label>
            <input className="field-input" id="weddingDate" name="weddingDate" type="date" required={f.weddingDate.required} />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="location">Location</label>
          <input className="field-input" id="location" name="location" type="text" autoComplete="address-level2" required={f.location.required} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="ceremonyLocation">Ceremony Location</label>
            <input
              className="field-input"
              id="ceremonyLocation"
              name="ceremonyLocation"
              type="text"
              required={f.ceremonyLocation.required}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="receptionLocation">Reception Location</label>
            <input
              className="field-input"
              id="receptionLocation"
              name="receptionLocation"
              type="text"
              required={f.receptionLocation.required}
            />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="estimatedGuests">Estimated Number of Guests</label>
          <input
            className="field-input"
            id="estimatedGuests"
            name="estimatedGuests"
            type="number"
            min={1}
            required={f.estimatedGuests.required}
          />
        </div>
      </div>

      {/* Step 3 — Services */}
      <div ref={(el) => { stepRefs.current[2] = el; }} className={currentStep === 2 ? "space-y-6" : "hidden"}>
        <h2 className="font-serif text-xl text-espresso-700">Services</h2>
        <p className="text-sm text-ink/60">Select everything you&rsquo;d like Moira Events to help with.</p>
        {categories.map((cat) => (
          <div key={cat.id}>
            <h3 className="mb-2 text-sm font-semibold text-espresso-600">{cat.name}</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {cat.services.map((svc) => (
                <label key={svc.id} className="flex items-center gap-2 text-sm text-ink/80">
                  <input type="checkbox" name="serviceIds" value={svc.id} className="h-4 w-4 rounded border-espresso-300" />
                  {svc.name}
                </label>
              ))}
            </div>
          </div>
        ))}
        {uncategorizedServices.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-espresso-600">Other Services</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {uncategorizedServices.map((svc) => (
                <label key={svc.id} className="flex items-center gap-2 text-sm text-ink/80">
                  <input type="checkbox" name="serviceIds" value={svc.id} className="h-4 w-4 rounded border-espresso-300" />
                  {svc.name}
                </label>
              ))}
            </div>
          </div>
        )}
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
      </div>

      {/* Step 4 — Budget */}
      <div ref={(el) => { stepRefs.current[3] = el; }} className={currentStep === 3 ? "space-y-4" : "hidden"}>
        <h2 className="font-serif text-xl text-espresso-700">Budget</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="budgetAmount">Estimated Budget</label>
            <input
              className="field-input"
              id="budgetAmount"
              name="budgetAmount"
              type="number"
              min={0}
              required={f.budgetAmount.required}
            />
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
      </div>

      {/* Step 5 — Additional Requirements */}
      <div ref={(el) => { stepRefs.current[4] = el; }} className={currentStep === 4 ? "space-y-4" : "hidden"}>
        <h2 className="font-serif text-xl text-espresso-700">Additional Requirements</h2>
        <div>
          <label className="field-label" htmlFor="message">
            Tell us about your wedding and what you would like Moira Events to help you with.
          </label>
          <textarea className="field-input" id="message" name="message" rows={5} required={f.message.required} />
        </div>
      </div>

      {/* Step 6 — Review & Submit */}
      <div ref={(el) => { stepRefs.current[5] = el; }} className={currentStep === 5 ? "space-y-4" : "hidden"}>
        <h2 className="font-serif text-xl text-espresso-700">Review &amp; Submit</h2>
        <p className="text-sm text-ink-muted">
          Please confirm your details are correct using the steps above, then submit your request. The Moira
          Events team will review your event requirements and contact you regarding the next steps.
        </p>
        {(reviewSummary.length > 0 || servicesSelectedCount > 0) && (
          <dl className="divide-y divide-espresso-100 rounded-lg border border-espresso-100 bg-ivory-50 text-sm">
            {reviewSummary.map((entry) => (
              <div key={entry.label} className="flex justify-between gap-4 px-4 py-2">
                <dt className="text-ink/60">{entry.label}</dt>
                <dd className="min-w-0 break-words text-right font-medium text-ink/80">{entry.value}</dd>
              </div>
            ))}
            {servicesSelectedCount > 0 && (
              <div className="flex justify-between gap-4 px-4 py-2">
                <dt className="text-ink/60">Services Selected</dt>
                <dd className="text-right font-medium text-ink/80">{servicesSelectedCount}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-espresso-100 pt-6">
        <button
          type="button"
          onClick={() => goToStep(Math.max(currentStep - 1, 0))}
          className="btn-secondary"
          disabled={currentStep === 0}
        >
          Back
        </button>
        {currentStep < steps.length - 1 ? (
          <button type="button" onClick={handleNext} className="btn-primary">
            Next
          </button>
        ) : (
          <button type="submit" className="btn-primary gap-2" disabled={isPending}>
            {isPending && <Spinner />}
            {isPending ? "Submitting..." : "Request My Quote"}
          </button>
        )}
      </div>
    </form>
  );
}
