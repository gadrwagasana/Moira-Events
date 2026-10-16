"use client";

// Provider-agnostic conversion-event abstraction (Stage P). Confirmed via
// repo-wide grep before writing this file: no analytics provider (Google
// Analytics, Plausible, PostHog, GTM, etc.) is configured or installed
// anywhere in this project. trackEvent() never pretends otherwise — in
// development it logs visibly so the event contract is verifiable right
// now (same "[tag] ..." convention already used by lib/email/send.ts's
// "[email:dev]" and lib/payments/mock-provider.ts's "[payment:mock]"); in
// production it is a deliberate no-op until a real provider is wired in
// here (one place to add it later).
//
// Never pass personal or confidential data as a prop: no names, emails,
// phone numbers, or event/enquiry descriptions. Only page paths, labels,
// and counts belong here.
export type AnalyticsEventName =
  | "service_page_view"
  | "primary_cta_click"
  | "enquiry_started"
  | "enquiry_step_completed"
  | "enquiry_submitted"
  | "enquiry_submission_failed"
  | "whatsapp_contact_click"
  | "email_contact_click";

export type AnalyticsEventProps = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: AnalyticsEventName, props?: AnalyticsEventProps): void {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[analytics:dev] ${name}`, props ?? {});
  }
  // No real provider configured — see SETUP.md's Analytics section for
  // configuration status and what's required to connect one.
}
