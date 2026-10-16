import { InvoiceStatus } from "@/lib/generated/prisma/client";

// Kept in its own, dependency-free file (same pattern as Stage L2's
// send-guard.ts files) so it stays directly unit-testable. DRAFT isn't
// finalized yet; VOID/CANCELLED are dead states. PAID is excluded too —
// if it's already fully paid there's nothing left to collect online
// (the actual outstanding-balance check is a second, independent guard
// applied on top of this one, not a replacement for it).
export const ONLINE_PAYABLE_INVOICE_STATUSES: InvoiceStatus[] = ["ISSUED", "PARTIALLY_PAID"];

export function isInvoiceOnlinePayable(status: InvoiceStatus): boolean {
  return ONLINE_PAYABLE_INVOICE_STATUSES.includes(status);
}
