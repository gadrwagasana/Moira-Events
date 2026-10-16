import { prisma } from "@/lib/db";
import { Prisma, TaskStatus, TaskPriority } from "@/lib/generated/prisma/client";

export async function getTasksList(filters: {
  q?: string;
  status?: string;
  priority?: string;
  bookingId?: string;
  overdueOnly?: boolean;
}) {
  const { q, status, priority, bookingId, overdueOnly } = filters;

  const where: Prisma.TaskWhereInput = {
    ...(status && Object.values(TaskStatus).includes(status as TaskStatus) ? { status: status as TaskStatus } : {}),
    ...(priority && Object.values(TaskPriority).includes(priority as TaskPriority)
      ? { priority: priority as TaskPriority }
      : {}),
    ...(bookingId ? { bookingId } : {}),
    ...(overdueOnly
      ? { dueDate: { lt: new Date() }, status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] } }
      : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { assignedTo: { contains: q, mode: "insensitive" } },
            { booking: { bookingNumber: { contains: q, mode: "insensitive" } } },
            { booking: { client: { fullName: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  return prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: { booking: { select: { id: true, bookingNumber: true, client: { select: { fullName: true } } } } },
  });
}
