-- DropIndex
DROP INDEX "Client_inviteToken_key";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "inviteToken",
ADD COLUMN     "emailVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailVerificationTokenHash" TEXT,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "inviteTokenHash" TEXT,
ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetTokenHash" TEXT,
ADD COLUMN     "pendingEmail" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_inviteTokenHash_key" ON "Client"("inviteTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Client_emailVerificationTokenHash_key" ON "Client"("emailVerificationTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Client_passwordResetTokenHash_key" ON "Client"("passwordResetTokenHash");

