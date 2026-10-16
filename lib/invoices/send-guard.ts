import { InvoiceStatus } from "@/lib/generated/prisma/client";

// Never DRAFT — issuing (DRAFT -> ISSUED) is a separate, pre-existing
// transition (updateInvoiceStatus); sending email must not bypass it.
export const SENDABLE_INVOICE_STATUSES: InvoiceStatus[] = ["ISSUED", "PARTIALLY_PAID", "PAID"];

export function isInvoiceSendable(status: InvoiceStatus): boolean {
  return SENDABLE_INVOICE_STATUSES.includes(status);
}
