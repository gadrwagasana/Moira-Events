import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

export async function getVendorsList(filters: { q?: string; category?: string; activeOnly?: boolean }) {
  const { q, category, activeOnly } = filters;

  const where: Prisma.VendorRecommendationWhereInput = {
    ...(category ? { category } : {}),
    ...(activeOnly ? { active: true } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { contactName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.vendorRecommendation.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { bookingRecommendations: true } } },
  });
}

export async function getVendorDetail(id: string) {
  return prisma.vendorRecommendation.findUnique({
    where: { id },
    include: {
      bookingRecommendations: {
        orderBy: { createdAt: "desc" },
        include: { booking: { select: { id: true, bookingNumber: true, client: { select: { fullName: true } } } } },
      },
    },
  });
}
