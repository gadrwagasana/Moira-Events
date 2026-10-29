-- CreateTable
CREATE TABLE "SiteCopy" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "SiteCopy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteCopy_key_key" ON "SiteCopy"("key");

-- AddForeignKey
ALTER TABLE "SiteCopy" ADD CONSTRAINT "SiteCopy_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
