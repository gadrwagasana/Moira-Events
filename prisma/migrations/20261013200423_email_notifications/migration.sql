-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('CLIENT_INVITATION', 'QUOTE_ISSUED', 'BOOKING_CONFIRMATION', 'INVOICE_ISSUED', 'PLANNING_RESPONSE');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "EmailDelivery" (
    "id" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "relatedRecordType" TEXT,
    "relatedRecordId" TEXT,
    "relatedRecordVersion" INTEGER,
    "idempotencyKey" TEXT NOT NULL,
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailDelivery_idempotencyKey_key" ON "EmailDelivery"("idempotencyKey");

-- CreateIndex
CREATE INDEX "EmailDelivery_relatedRecordType_relatedRecordId_idx" ON "EmailDelivery"("relatedRecordType", "relatedRecordId");

-- CreateIndex
CREATE INDEX "EmailDelivery_status_idx" ON "EmailDelivery"("status");

