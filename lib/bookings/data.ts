import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { BookingStatus, Prisma } from "@/lib/generated/prisma/client";

export async function getBookingDetail(id: string) {
  return withDbRetry(() =>
    prisma.booking.findUnique({
      where: { id },
      include: {
        client: true,
        event: true,
        weddingType: true,
        quote: { include: { enquiry: true } },
        services: { orderBy: { sortOrder: "asc" } },
        statusHistory: { orderBy: { createdAt: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
        invoices: { include: { items: true }, orderBy: { createdAt: "desc" } },
        timelineItems: { orderBy: [{ date: "asc" }, { sortOrder: "asc" }] },
        tasks: { orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] },
        vendorRecommendations: { include: { vendorRecommendation: true }, orderBy: { createdAt: "desc" } },
        planningNoteEntries: { orderBy: { createdAt: "desc" } },
        planningRequests: {
          orderBy: { createdAt: "desc" },
          include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
        },
      },
    }),
  );
}

export async function getBookingsList(filters: { q?: string; status?: string }) {
  const { q, status } = filters;

  const where: Prisma.BookingWhereInput = {
    ...(status && Object.values(BookingStatus).includes(status as BookingStatus)
      ? { status: status as BookingStatus }
      : {}),
    ...(q
      ? {
          OR: [
            { bookingNumber: { contains: q, mode: "insensitive" } },
            { client: { fullName: { contains: q, mode: "insensitive" } } },
            { client: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  return prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { client: true, event: true },
  });
}

// Non-blocking admin warning (§12) — never used to reject creation or a
// status change, only surfaced as information on the detail page.
export async function findOtherBookingsOnSameDate(bookingId: string, eventDate: Date | null) {
  if (!eventDate) return [];
  const startOfDay = new Date(eventDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(eventDate);
  endOfDay.setHours(23, 59, 59, 999);

  return withDbRetry(() =>
    prisma.booking.findMany({
      where: {
        id: { not: bookingId },
        eventDate: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CANCELLED"] },
      },
      include: { client: true },
    }),
  );
}
