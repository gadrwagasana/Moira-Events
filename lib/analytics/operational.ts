import { prisma } from "@/lib/db";
import { BookingStatus, ConsultationStatus, PlanningRequestStatus } from "@/lib/generated/prisma/client";
import { getAuditEventsList } from "@/lib/audit/data";
import { parseDateRangeWhere, type DateRangeParams } from "./date-range";

export async function getUpcomingEvents(withinDays = 60) {
  const now = new Date();
  const until = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  return prisma.booking.findMany({
    where: { eventDate: { gte: now, lte: until }, status: { not: BookingStatus.CANCELLED } },
    orderBy: { eventDate: "asc" },
    select: { id: true, bookingNumber: true, eventDate: true, status: true, client: { select: { fullName: true } } },
  });
}

const OPEN_PLANNING_REQUEST_STATUSES = [
  PlanningRequestStatus.OPEN,
  PlanningRequestStatus.IN_REVIEW,
  PlanningRequestStatus.RESPONDED,
] as const;

export async function getPlanningRequestAges() {
  const now = Date.now();
  const requests = await prisma.planningRequest.findMany({
    where: { status: { in: [...OPEN_PLANNING_REQUEST_STATUSES] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      createdAt: true,
      booking: { select: { bookingNumber: true } },
    },
  });
  return requests.map((r) => ({ ...r, ageDays: Math.floor((now - r.createdAt.getTime()) / (24 * 60 * 60 * 1000)) }));
}

// Consultation has no relation to Enquiry in the data model (it's an
// independent intake path keyed only by clientId) — reported here as its
// own operational count, never folded into the Enquiry->Quote->Booking
// funnel in lib/analytics/funnel.ts.
export async function getConsultationCounts(range: DateRangeParams) {
  const groups = await prisma.consultation.groupBy({
    by: ["status"],
    where: parseDateRangeWhere("createdAt", range),
    _count: { _all: true },
  });
  return groups.map((g) => ({ status: g.status as ConsultationStatus, count: g._count._all }));
}

export async function getRecentActivity(take = 25) {
  return getAuditEventsList({}, take);
}
