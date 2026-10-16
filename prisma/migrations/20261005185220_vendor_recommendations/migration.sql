-- DropForeignKey
ALTER TABLE "BookingVendor" DROP CONSTRAINT "BookingVendor_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "BookingVendor" DROP CONSTRAINT "BookingVendor_vendorId_fkey";

-- DropTable
DROP TABLE "BookingVendor";

-- DropTable
DROP TABLE "Vendor";

-- DropEnum
DROP TYPE "BookingVendorStatus";

-- CreateTable
CREATE TABLE "VendorRecommendation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingVendorRecommendation" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vendorRecommendationId" TEXT NOT NULL,
    "serviceDescription" TEXT,
    "notes" TEXT,
    "clientVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingVendorRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingVendorRecommendation_bookingId_idx" ON "BookingVendorRecommendation"("bookingId");

-- CreateIndex
CREATE INDEX "BookingVendorRecommendation_vendorRecommendationId_idx" ON "BookingVendorRecommendation"("vendorRecommendationId");

-- AddForeignKey
ALTER TABLE "BookingVendorRecommendation" ADD CONSTRAINT "BookingVendorRecommendation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingVendorRecommendation" ADD CONSTRAINT "BookingVendorRecommendation_vendorRecommendationId_fkey" FOREIGN KEY ("vendorRecommendationId") REFERENCES "VendorRecommendation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

