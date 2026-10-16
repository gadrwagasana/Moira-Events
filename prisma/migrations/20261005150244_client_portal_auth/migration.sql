-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "inviteTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "passwordSetAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Client_inviteToken_key" ON "Client"("inviteToken");

