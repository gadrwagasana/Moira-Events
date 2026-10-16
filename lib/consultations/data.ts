import { prisma } from "@/lib/db";
import { ConsultationStatus, Prisma } from "@/lib/generated/prisma/client";

export async function getConsultationDetail(id: string) {
  return prisma.consultation.findUnique({
    where: { id },
    include: {
      client: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getConsultationsList(filters: { q?: string; status?: string }) {
  const { q, status } = filters;

  const where: Prisma.ConsultationWhereInput = {
    ...(status && Object.values(ConsultationStatus).includes(status as ConsultationStatus)
      ? { status: status as ConsultationStatus }
      : {}),
    ...(q
      ? {
          OR: [
            { referenceNumber: { contains: q, mode: "insensitive" } },
            { client: { fullName: { contains: q, mode: "insensitive" } } },
            { client: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  return prisma.consultation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { client: true },
  });
}
