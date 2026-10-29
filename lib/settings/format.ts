// Pure formatting — no database, no Next.js import, directly unit-testable.
// Derives the human-readable display form from the single stored E.164
// value so the two can never drift out of sync (the old lib/content/config.ts
// stored both phoneIntl and phoneDisplay as separate hand-written constants,
// which is exactly the kind of duplication a single source of truth avoids).
//
// Only handles Rwanda's +250 country code with an 9-digit national number
// (the confirmed, only number this business has ever used) — grouped as
// "XXX XXX XXX" to match the exact display form already used throughout
// this app before this change (e.g. "+250 787 553 323").
export function formatE164Phone(e164: string | null | undefined): string {
  if (!e164) return "";
  const match = e164.match(/^\+250(\d{9})$/);
  if (!match) return e164; // unrecognized shape — show the raw value rather than mangle it
  const digits = match[1];
  return `+250 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
}
