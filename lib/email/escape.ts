// Ampersand MUST be escaped first — escaping `<`/`>`/`"`/`'` before `&`
// would double-encode the entities those replacements just produced
// (e.g. "&lt;" becoming "&amp;lt;").
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// For client-controlled text placed in an email SUBJECT line (e.g. a
// PlanningRequest's own subject, written by the client). HTML-escaping
// doesn't address this — a raw CR/LF in a subject string is a header/field
// injection vector regardless of transport, so strip control characters
// and hard-cap length before interpolating. Never call this for the HTML
// body; use escapeHtml there instead.
export function sanitizeForSubject(value: string): string {
  // Deliberately stripping all C0/C1 control characters, including CR/LF.
  return value.replace(/[\x00-\x1F\x7F]/g, " ").trim().slice(0, 150);
}
