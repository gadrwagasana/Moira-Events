
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "invoiceId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Hand-added (Stage N): partial unique indexes not expressible in Prisma's
-- schema DSL. See the comment on the Payment model in schema.prisma.

-- One reference value can't be claimed by two online payments at once.
-- Manual payments keep free-text references ("Cash", "N/A", repeats) and
-- are completely unaffected since this index only applies where
-- provider IS NOT NULL.
CREATE UNIQUE INDEX "Payment_online_reference_key" ON "Payment"("reference") WHERE "provider" IS NOT NULL;

-- At most one in-flight (PENDING/PROCESSING) online payment attempt per
-- invoice at a time — this is the actual double-click/duplicate-attempt
-- guard for the Pay Invoice action.
CREATE UNIQUE INDEX "Payment_one_inflight_per_invoice" ON "Payment"("invoiceId") WHERE "status" IN ('PENDING', 'PROCESSING') AND "provider" IS NOT NULL;

