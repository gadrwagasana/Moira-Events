import { QuoteStatus } from "@/lib/generated/prisma/client";

// Quote has no dedicated transition-map module (unlike Invoice/Booking) —
// this is a minimal allowlist for "is this quote in a state where emailing
// it to the client makes sense," not a general transition system. DRAFT/
// INTERNAL_REVIEW aren't ready to show a client; DECLINED/EXPIRED/CANCELLED
// are dead states. Kept in its own module (no @react-pdf/renderer import
// anywhere in this file) so it can be unit-tested directly.
export const SENDABLE_QUOTE_STATUSES: QuoteStatus[] = ["SENT", "REVISION_REQUESTED", "ACCEPTED"];

export function isQuoteSendable(status: QuoteStatus): boolean {
  return SENDABLE_QUOTE_STATUSES.includes(status);
}
