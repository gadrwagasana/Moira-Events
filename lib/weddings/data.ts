import { prisma } from "@/lib/db";

export async function getActiveWeddingTypes() {
  return prisma.weddingType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getWeddingServiceCatalogue() {
  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      services: {
        where: { division: "WEDDING", isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const uncategorized = await prisma.service.findMany({
    where: { division: "WEDDING", isActive: true, categoryId: null },
    orderBy: { sortOrder: "asc" },
  });

  const inactive = await prisma.service.findMany({
    where: { division: "WEDDING", isActive: false },
    orderBy: { sortOrder: "asc" },
  });

  return {
    categories: categories.filter((c) => c.services.length > 0),
    uncategorized,
    inactive,
  };
}
