-- CreateEnum
CREATE TYPE "NavLocation" AS ENUM ('HEADER', 'FOOTER');

-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "noindex" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CmsPage" ADD COLUMN     "isSystemPage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "noindex" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "siteName" TEXT NOT NULL DEFAULT 'Moira Events',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "phoneE164" TEXT,
    "contactEmail" TEXT,
    "whatsappNumber" TEXT,
    "addressLine" TEXT,
    "city" TEXT,
    "openingHours" TEXT,
    "googleMapsUrl" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "tiktokUrl" TEXT,
    "linkedinUrl" TEXT,
    "youtubeUrl" TEXT,
    "primaryCtaLabel" TEXT,
    "primaryCtaHref" TEXT,
    "secondaryCtaLabel" TEXT,
    "secondaryCtaHref" TEXT,
    "titleTemplate" TEXT NOT NULL DEFAULT '%s | Moira Events',
    "defaultMetaDescription" TEXT,
    "defaultOgImageUrl" TEXT,
    "gscVerification" TEXT,
    "ga4Id" TEXT,
    "metaPixelId" TEXT,
    "quoteRecipientEmail" TEXT,
    "consultationRecipientEmail" TEXT,
    "contactRecipientEmail" TEXT,
    "quoteAutoReplyTemplate" TEXT,
    "consultationAutoReplyTemplate" TEXT,
    "contactAutoReplyTemplate" TEXT,
    "whatsappSmsNotifyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "announcementText" TEXT,
    "announcementLink" TEXT,
    "announcementColor" TEXT,
    "announcementStartAt" TIMESTAMP(3),
    "announcementEndAt" TIMESTAMP(3),
    "announcementDismissible" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "cookieConsentText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT,
    "cmsPageId" TEXT,
    "location" "NavLocation" NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "eventType" "EventType",
    "quote" TEXT NOT NULL,
    "rating" INTEGER,
    "photoUrl" TEXT,
    "alt" TEXT,
    "featuredOnHomepage" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventType" "EventType",
    "shortDescription" TEXT,
    "inclusions" JSONB NOT NULL DEFAULT '[]',
    "fromPriceMinor" INTEGER,
    "currency" TEXT DEFAULT 'RWF',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "photoUrl" TEXT,
    "alt" TEXT,
    "bio" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "alt" TEXT,
    "url" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stat" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NavigationItem_location_idx" ON "NavigationItem"("location");

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_fromPath_key" ON "Redirect"("fromPath");

-- CreateIndex
CREATE INDEX "Testimonial_published_idx" ON "Testimonial"("published");

-- CreateIndex
CREATE INDEX "Faq_published_idx" ON "Faq"("published");

-- CreateIndex
CREATE INDEX "ServicePackage_published_idx" ON "ServicePackage"("published");

-- CreateIndex
CREATE INDEX "TeamMember_published_idx" ON "TeamMember"("published");

-- CreateIndex
CREATE INDEX "Partner_published_idx" ON "Partner"("published");

-- CreateIndex
CREATE INDEX "Stat_published_idx" ON "Stat"("published");

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_cmsPageId_fkey" FOREIGN KEY ("cmsPageId") REFERENCES "CmsPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NavigationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
