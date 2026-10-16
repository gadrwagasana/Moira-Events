
-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('ADMIN', 'CLIENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditOutcome" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('QUOTE', 'INVOICE', 'BOOKING_CONFIRMATION');

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorType" "AuditActorType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "outcome" "AuditOutcome" NOT NULL,
    "correlationId" TEXT,
    "summary" TEXT NOT NULL,
    "beforeValue" TEXT,
    "afterValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRecord" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "relatedRecordId" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "version" INTEGER,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "fileSizeBytes" INTEGER NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "storageProvider" TEXT,
    "storageKey" TEXT,
    "actorType" "AuditActorType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_actorType_actorId_idx" ON "AuditEvent"("actorType", "actorId");

-- CreateIndex
CREATE INDEX "AuditEvent_action_idx" ON "AuditEvent"("action");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "DocumentRecord_type_relatedRecordId_idx" ON "DocumentRecord"("type", "relatedRecordId");

-- CreateIndex
CREATE INDEX "DocumentRecord_createdAt_idx" ON "DocumentRecord"("createdAt");

