-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'GENERAL';

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "referenceNumber" TEXT NOT NULL,
ALTER COLUMN "clientId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "eventSubtype" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_referenceNumber_key" ON "Consultation"("referenceNumber");

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

