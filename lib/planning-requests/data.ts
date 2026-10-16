import { prisma } from "@/lib/db";
import { Prisma, PlanningRequestStatus, TaskPriority } from "@/lib/generated/prisma/client";

export async function getPlanningRequestsList(filters: {
  q?: string;
  status?: string;
  priority?: string;
  bookingId?: string;
  clientId?: string;
}) {
  const { q, status, priority, bookingId, clientId } = filters;

  const where: Prisma.PlanningRequestWhereInput = {
    ...(status && Object.values(PlanningRequestStatus).includes(status as PlanningRequestStatus)
      ? { status: status as PlanningRequestStatus }
      : {}),
    ...(priority && Object.values(TaskPriority).includes(priority as TaskPriority)
      ? { priority: priority as TaskPriority }
      : {}),
    ...(bookingId ? { bookingId } : {}),
    ...(clientId ? { clientId } : {}),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } },
            { client: { fullName: { contains: q, mode: "insensitive" } } },
            { booking: { bookingNumber: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  return prisma.planningRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { fullName: true, email: true } },
      booking: { select: { id: true, bookingNumber: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function getPlanningRequestDetail(id: string) {
  return prisma.planningRequest.findUnique({
    where: { id },
    include: {
      client: { select: { fullName: true, email: true } },
      booking: { select: { id: true, bookingNumber: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}
