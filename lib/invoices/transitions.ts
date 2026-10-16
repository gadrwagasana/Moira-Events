import { InvoiceStatus } from "@/lib/generated/prisma/client";

// An issued/paid invoice can still be corrected via VOID, but is never
// silently edited — items/discount/tax/notes stay DRAFT-only (Stage H §20).
// PAID/PARTIALLY_PAID are admin-chosen transitions here, not auto-derived
// from the payment ledger (same principle already established for Booking
// in Stage G §20) — the derived, always-accurate numbers are shown
// separately via computePaymentSummary so admin has what's needed to decide.
const allowedTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ["ISSUED", "CANCELLED"],
  ISSUED: ["PARTIALLY_PAID", "PAID", "VOID", "CANCELLED"],
  PARTIALLY_PAID: ["PAID", "VOID"],
  PAID: ["VOID"],
  VOID: [],
  CANCELLED: [],
};

export function getValidNextStatuses(current: InvoiceStatus): InvoiceStatus[] {
  return allowedTransitions[current];
}

export function isValidTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return allowedTransitions[from].includes(to);
}
