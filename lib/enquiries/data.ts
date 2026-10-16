import { prisma } from "@/lib/db";

export async function getServiceOptions(division: "WEDDING" | "PARTY" | "CORPORATE") {
  return prisma.service.findMany({
    where: { division, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}
