// Display-only formatting helpers for the admin UI. These never change what
// is stored or queried — only how a value is shown.

// "16 Oct 2026" (en-GB day-month-year order, abbreviated month), rendered in
// Rwanda's own time zone. This is a different convention from
// lib/documents/format.ts's formatDate, which deliberately uses UTC getters
// so a generated PDF shows the exact stored instant with no timezone
// interpretation at all — that guarantee matters for a legal/financial
// document. This helper is for admin-UI screen display, where showing the
// date in the business's own local time zone is what was explicitly
// requested.
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Kigali",
  }).format(date);
}

// Display-only title casing — never writes back to the database. A name
// stored as "JOHN DOE" or "john doe" renders as "John Doe"; this does not
// attempt to special-case particles (e.g. "van", "de") since no such names
// have come up in this app's actual data.
export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
