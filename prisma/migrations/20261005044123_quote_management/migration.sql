-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QuoteStatus" ADD VALUE 'INTERNAL_REVIEW';
ALTER TYPE "QuoteStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "notes",
ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "acceptedBy" TEXT,
ADD COLUMN     "clientNotes" TEXT,
ADD COLUMN     "declineReason" TEXT,
ADD COLUMN     "declinedAt" TIMESTAMP(3),
ADD COLUMN     "declinedBy" TEXT,
ADD COLUMN     "discountAmount" DECIMAL(65,30),
ADD COLUMN     "discountNote" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "issueDate" TIMESTAMP(3),
ADD COLUMN     "revisionRequestNote" TEXT,
ADD COLUMN     "revisionRequestedAt" TIMESTAMP(3),
ADD COLUMN     "subtotal" DECIMAL(65,30),
ADD COLUMN     "taxAmount" DECIMAL(65,30),
ADD COLUMN     "taxNote" TEXT,
ADD COLUMN     "totalAmount" DECIMAL(65,30),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "QuoteItem" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "QuoteRevision" ADD COLUMN     "changedBy" TEXT,
ADD COLUMN     "snapshot" JSONB,
ADD COLUMN     "versionNumber" INTEGER NOT NULL,
ALTER COLUMN "requestedNote" DROP NOT NULL;

