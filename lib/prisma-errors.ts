import { Prisma } from "@/lib/generated/prisma/client";

// This project's Prisma 7 + @prisma/adapter-pg driver-adapter setup does
// NOT report P2002 in the classic `{target: string[]}` shape several older
// files in this codebase assume (the quotes/invoices/bookings actions.ts
// reference-number retry loops) — confirmed by direct testing in Stage L2:
// the real shape is
// `{driverAdapterError: {cause: {constraint: {index: "Model_field_key"}}}}`.
// Checked defensively against both shapes. Copied here (not imported from
// lib/email/outbox.ts, which has its own identical local copy) so Stage N
// doesn't need to touch L2 files at all.
export function isUniqueConstraintError(err: unknown, field: string): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") return false;
  const meta = err.meta as
    | { target?: string[]; driverAdapterError?: { cause?: { constraint?: { index?: string } } } }
    | undefined;
  if (Array.isArray(meta?.target) && meta.target.includes(field)) return true;
  const indexName = meta?.driverAdapterError?.cause?.constraint?.index;
  return typeof indexName === "string" && indexName.includes(field);
}
