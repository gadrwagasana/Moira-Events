-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "scheduledDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ConsultationStatusHistory" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "previousStatus" "ConsultationStatus",
    "newStatus" "ConsultationStatus" NOT NULL,
    "changedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConsultationStatusHistory" ADD CONSTRAINT "ConsultationStatusHistory_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

