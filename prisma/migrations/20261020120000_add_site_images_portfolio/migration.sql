-- CreateTable
CREATE TABLE "SiteImageSlot" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "imageUrl" TEXT,
    "alt" TEXT,
    "caption" TEXT,
    "focalX" INTEGER NOT NULL DEFAULT 50,
    "focalY" INTEGER NOT NULL DEFAULT 50,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "SiteImageSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "guestCount" INTEGER,
    "venueOrCity" TEXT,
    "story" TEXT,
    "imageUrl" TEXT,
    "alt" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteImageSlot_key_key" ON "SiteImageSlot"("key");

-- CreateIndex
CREATE INDEX "PortfolioItem_published_idx" ON "PortfolioItem"("published");

-- AddForeignKey
ALTER TABLE "SiteImageSlot" ADD CONSTRAINT "SiteImageSlot_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
