// Closed literal-union lists for AuditEvent.action/entityType — used by
// every recordAuditEvent/auditEventQuery call site AND by the /admin/audit
// filter dropdowns, so "filter by action" stays reliable instead of
// drifting across ~15+ free-text call sites (e.g. "quote.status_changed"
// vs "quote.statusChanged").

export const AUDIT_ENTITY_TYPES = [
  "Quote",
  "Invoice",
  "Booking",
  "Payment",
  "PlanningRequest",
  "Document",
  "Email",
] as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export const AUDIT_ACTIONS = [
  "quote.created",
  "quote.status_changed",
  "invoice.status_changed",
  "booking.created",
  "booking.status_changed",
  "payment.recorded",
  "payment.status_changed",
  "document.generated",
  "planning_request.created",
  "planning_request.follow_up_added",
  "planning_request.responded",
  "planning_request.notification_sent",
  "planning_request.status_changed",
  "planning_request.priority_changed",
  "email.quote_issued",
  "email.invoice_issued",
  "email.booking_confirmation",
  "payment.online_initiated",
  "payment.online_verified",
  "payment.online_webhook_rejected",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
