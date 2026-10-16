import { prisma } from "@/lib/db";
import { BookingStatus } from "@/lib/generated/prisma/client";

const planningRequestListSelect = {
  id: true,
  subject: true,
  status: true,
  priority: true,
  createdAt: true,
  booking: { select: { bookingNumber: true } },
  messages: { select: { id: true }, orderBy: { createdAt: "desc" as const }, take: 1 },
} as const;

const planningRequestMessageSelect = {
  id: true,
  senderType: true,
  message: true,
  createdAt: true,
} as const;

// Every loader below takes the authenticated clientId (never a bare id the
// caller trusts on its own) and scopes its query through the ownership
// chain client -> booking -> (quote/invoice/payment). `select` is used
// everywhere instead of a blanket `include` so internal-only fields
// (internalNotes, planningNotes, createdBy/updatedBy, provider* fields,
// every *StatusHistory table, QuoteRevision) are structurally excluded,
// not just hidden in the UI.

// invoiceId added (Stage N) — harmless for existing booking-level summary
// consumers (computePaymentSummary ignores fields it doesn't read), needed
// by the new invoice-scoped online-payment amount-due calculation.
const paymentSummaryShape = { amount: true, status: true, refundAmount: true, invoiceId: true } as const;

export async function getClientProfile(clientId: string) {
  return prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      whatsapp: true,
      preferredContactMethod: true,
      createdAt: true,
    },
  });
}

const bookingSelect = {
  id: true,
  bookingNumber: true,
  status: true,
  eventDate: true,
  location: true,
  estimatedGuests: true,
  quoteId: true,
  agreedTotal: true,
  currency: true,
  createdAt: true,
  weddingType: { select: { name: true } },
  event: { select: { type: true, eventSubtype: true } },
  services: {
    select: { id: true, description: true, quantity: true, unit: true, unitPrice: true, total: true },
    orderBy: { sortOrder: "asc" as const },
  },
} as const;

export async function getBookingDetailForClient(clientId: string, bookingId: string) {
  return prisma.booking.findFirst({
    where: { id: bookingId, clientId },
    select: bookingSelect,
  });
}

// Highlights the soonest upcoming (non-cancelled) booking; falls back to the
// most recently created non-cancelled booking, then to the most recent
// booking at all (so a client isn't shown nothing just because their only
// booking was cancelled). Multi-booking switcher UI is not built this stage
// (see plan) — the data layer still supports it (getBookingDetailForClient
// works for any owned booking id).
export async function getPrimaryBookingForClient(clientId: string) {
  const upcoming = await prisma.booking.findFirst({
    where: { clientId, status: { not: BookingStatus.CANCELLED }, eventDate: { gte: new Date() } },
    orderBy: { eventDate: "asc" },
    select: bookingSelect,
  });
  if (upcoming) return upcoming;

  const mostRecentActive = await prisma.booking.findFirst({
    where: { clientId, status: { not: BookingStatus.CANCELLED } },
    orderBy: { createdAt: "desc" },
    select: bookingSelect,
  });
  if (mostRecentActive) return mostRecentActive;

  return prisma.booking.findFirst({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    select: bookingSelect,
  });
}

// Per the plan's scoping decision: only the Quote actually attached to an
// owned Booking is ever shown (by Stage F's own rule that can only be an
// ACCEPTED quote) — never a pre-booking DRAFT/SENT quote.
export async function getQuoteForClientBooking(clientId: string, bookingId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, clientId },
    select: { quoteId: true },
  });
  if (!booking?.quoteId) return null;

  return prisma.quote.findFirst({
    where: { id: booking.quoteId, booking: { clientId } },
    select: {
      quoteNumber: true,
      version: true,
      status: true,
      issueDate: true,
      expiresAt: true,
      currency: true,
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      totalAmount: true,
      clientNotes: true,
      terms: true,
      items: {
        select: { id: true, description: true, quantity: true, unit: true, unitPrice: true, total: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function getInvoicesForClient(clientId: string) {
  return prisma.invoice.findMany({
    where: { booking: { clientId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      issueDate: true,
      dueDate: true,
      currency: true,
      total: true,
      createdAt: true,
      bookingId: true,
      booking: {
        select: {
          bookingNumber: true,
          payments: { select: paymentSummaryShape },
          _count: { select: { invoices: true } },
        },
      },
    },
  });
}

export async function getInvoiceDetailForClient(clientId: string, invoiceId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, booking: { clientId } },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      issueDate: true,
      dueDate: true,
      currency: true,
      subtotal: true,
      discount: true,
      tax: true,
      total: true,
      clientNotes: true,
      terms: true,
      createdAt: true,
      items: {
        select: { id: true, description: true, quantity: true, unitPrice: true, lineTotal: true },
        orderBy: { sortOrder: "asc" },
      },
      booking: {
        select: {
          id: true,
          bookingNumber: true,
          agreedTotal: true,
          payments: { select: paymentSummaryShape },
          _count: { select: { invoices: true } },
        },
      },
    },
  });
}

// Scoped to one owned booking — used for the dashboard's financial summary,
// which deliberately reflects the highlighted booking only (see plan's
// multi-booking scoping decision). getPaymentsForClient below covers all of
// a client's bookings for the full Payments page.
export async function getPaymentsForBooking(clientId: string, bookingId: string) {
  return prisma.payment.findMany({
    where: { bookingId, booking: { clientId } },
    select: paymentSummaryShape,
  });
}

export async function getInvoicesForBooking(clientId: string, bookingId: string) {
  return prisma.invoice.findMany({
    where: { bookingId, booking: { clientId } },
    select: { total: true },
  });
}

// --- Stage J: client-visible planning data -----------------------------
// Same discipline as everything above: ownership-scoped via the booking's
// clientId, AND filtered to clientVisible: true — internal planning rows
// (the majority, by default) are structurally excluded, not just hidden in
// the UI. No internal fields (notes, assignedTo, priority, createdBy) ever
// appear in these selects.

export async function getClientVisibleTimelineForBooking(clientId: string, bookingId: string) {
  return prisma.eventTimelineItem.findMany({
    where: { bookingId, clientVisible: true, booking: { clientId } },
    orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
    select: { id: true, title: true, description: true, date: true, type: true, status: true },
  });
}

export async function getClientVisibleTasksForBooking(clientId: string, bookingId: string) {
  return prisma.task.findMany({
    where: { bookingId, clientVisible: true, booking: { clientId } },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    select: { id: true, title: true, description: true, status: true, dueDate: true },
  });
}

export async function getClientVisibleVendorsForBooking(clientId: string, bookingId: string) {
  return prisma.bookingVendorRecommendation.findMany({
    where: { bookingId, clientVisible: true, booking: { clientId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      serviceDescription: true,
      vendorRecommendation: {
        select: { name: true, category: true, description: true, contactName: true, email: true, phone: true, website: true },
      },
    },
  });
}

export async function getClientVisiblePlanningNotesForBooking(clientId: string, bookingId: string) {
  return prisma.planningNote.findMany({
    where: { bookingId, clientVisible: true, booking: { clientId } },
    orderBy: { createdAt: "desc" },
    select: { id: true, content: true, createdAt: true },
  });
}

export async function getPaymentsForClient(clientId: string) {
  return prisma.payment.findMany({
    where: { booking: { clientId } },
    orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      type: true,
      method: true,
      reference: true,
      paymentDate: true,
      refundAmount: true,
      refundDate: true,
      refundReference: true,
      createdAt: true,
      booking: { select: { bookingNumber: true } },
    },
  });
}

// --- Stage K: planning requests ------------------------------------------
// Scoped directly by clientId (the authoritative owner field, set once at
// creation from the session — never by a booking join), so this naturally
// covers every booking a client has, not just the "primary" one.

export async function getPlanningRequestsForClient(clientId: string) {
  return prisma.planningRequest.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    select: planningRequestListSelect,
  });
}

export async function getPlanningRequestDetailForClient(clientId: string, requestId: string) {
  return prisma.planningRequest.findFirst({
    where: { id: requestId, clientId },
    select: {
      id: true,
      subject: true,
      message: true,
      status: true,
      priority: true,
      createdAt: true,
      booking: { select: { bookingNumber: true } },
      messages: { orderBy: { createdAt: "asc" }, select: planningRequestMessageSelect },
    },
  });
}
