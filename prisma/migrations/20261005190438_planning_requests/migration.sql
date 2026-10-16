-- CreateEnum
CREATE TYPE "PlanningRequestStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESPONDED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlanningRequestSenderType" AS ENUM ('CLIENT', 'STAFF');

-- CreateTable
CREATE TABLE "PlanningRequest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "PlanningRequestStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningRequestMessage" (
    "id" TEXT NOT NULL,
    "planningRequestId" TEXT NOT NULL,
    "senderType" "PlanningRequestSenderType" NOT NULL,
    "message" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningRequestMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningRequest_bookingId_idx" ON "PlanningRequest"("bookingId");

-- CreateIndex
CREATE INDEX "PlanningRequest_clientId_idx" ON "PlanningRequest"("clientId");

-- CreateIndex
CREATE INDEX "PlanningRequest_status_idx" ON "PlanningRequest"("status");

-- CreateIndex
CREATE INDEX "PlanningRequest_priority_idx" ON "PlanningRequest"("priority");

-- CreateIndex
CREATE INDEX "PlanningRequest_createdAt_idx" ON "PlanningRequest"("createdAt");

-- CreateIndex
CREATE INDEX "PlanningRequestMessage_planningRequestId_idx" ON "PlanningRequestMessage"("planningRequestId");

-- AddForeignKey
ALTER TABLE "PlanningRequest" ADD CONSTRAINT "PlanningRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningRequest" ADD CONSTRAINT "PlanningRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningRequestMessage" ADD CONSTRAINT "PlanningRequestMessage_planningRequestId_fkey" FOREIGN KEY ("planningRequestId") REFERENCES "PlanningRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

