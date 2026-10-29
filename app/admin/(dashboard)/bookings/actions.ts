"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma, BookingStatus, EventTimelineStatus } from "@/lib/generated/prisma/client";
import { generateReferenceNumber } from "@/lib/enquiries/reference";
import { isValidTransition } from "@/lib/bookings/transitions";
import { isValidTransition as isValidTimelineTransition } from "@/lib/timeline/transitions";
import { getBookingDetail } from "@/lib/bookings/data";
import { getBookingDocumentForAdmin } from "@/lib/documents/booking";
import { BookingPdf } from "@/lib/documents/booking-pdf";
import { renderPdfBuffer } from "@/lib/documents/render";
import { formatDate } from "@/lib/documents/format";
import { bookingConfirmationEmail, appUrl } from "@/lib/email/templates";
import { sendTrackedEmail, type SendEmailFormState } from "@/lib/email/outbox";
import { isBookingSendable } from "@/lib/bookings/send-guard";
import { auditEventQuery, recordAuditEvent } from "@/lib/audit/log";
import { isUniqueConstraintError } from "@/lib/prisma-errors";
import { requireAdminRole } from "@/lib/admin/auth";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

// Stage F §1 (Critical Business Rule): only an ACCEPTED quote may become a
// booking. §7/§13: the booking snapshots the agreed commercial state rather
// than reading Event/Quote/Service live, so later edits elsewhere can't
// retroactively change what was actually agreed. §20: idempotent — a second
// click (or a second request) lands on the existing booking instead of
// creating a duplicate, backed by the DB-unique Booking.quoteId.
export async function createBookingFromQuote(quoteId: string) {
  await requireAdminRole("ADMIN");
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      booking: true,
      items: true,
      enquiry: { include: { client: true, event: true } },
    },
  });
  if (!quote) throw new Error("Quote not found");

  if (quote.booking) {
    redirect(`/admin/bookings/${quote.booking.id}`);
  }

  if (quote.status !== "ACCEPTED") {
    throw new Error("Only an accepted quote can become a booking");
  }

  const { client, event } = quote.enquiry;

  let bookingId: string | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    const bookingNumber = generateReferenceNumber("MB");
    try {
      const booking = await prisma.booking.create({
        data: {
          bookingNumber,
          clientId: client.id,
          eventId: event.id,
          quoteId: quote.id,
          acceptedQuoteVersion: quote.version,
          eventDate: event.eventDate,
          location: event.location,
          estimatedGuests: event.estimatedGuests,
          weddingTypeId: event.weddingTypeId,
          agreedTotal: quote.totalAmount,
          currency: quote.currency,
          createdBy: "admin",
          services: {
            create: quote.items.map((item, i) => ({
              serviceId: item.serviceId,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              total: item.total,
              sortOrder: i,
            })),
          },
          statusHistory: {
            create: {
              previousStatus: null,
              newStatus: "PENDING",
              changedBy: "admin",
              note: "Booking created from accepted quote.",
            },
          },
        },
      });
      bookingId = booking.id;
      break;
    } catch (err) {
      if (!isUniqueConstraintError(err, "bookingNumber")) throw err;
      // else loop and retry with a freshly generated booking number
    }
  }

  if (!bookingId) throw new Error("Could not generate a unique booking number");

  // Only in the real-creation branch (not the early "already exists"
  // redirect above) and before the redirect below — anything placed after
  // redirect() would be dead code, since it throws to unwind this function.
  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: "admin",
    action: "booking.created",
    entityType: "Booking",
    entityId: bookingId,
    outcome: "SUCCESS",
    summary: `Booking created from accepted quote ${quote.quoteNumber}`,
  });

  revalidatePath(`/admin/quotes/${quoteId}`);
  redirect(`/admin/bookings/${bookingId}`);
}

const statusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  changedBy: z.preprocess(emptyToUndefined, z.string().optional()),
  note: z.preprocess(emptyToUndefined, z.string().optional()),
});

export async function updateBookingStatus(bookingId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });

  // §10: only a valid next-status is applied — the UI only offers valid
  // options too, but this re-validates server-side regardless.
  if (!isValidTransition(booking.status, data.status)) return;

  await prisma.$transaction([
    prisma.booking.update({ where: { id: bookingId }, data: { status: data.status } }),
    prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        previousStatus: booking.status,
        newStatus: data.status,
        changedBy: data.changedBy,
        note: data.note,
      },
    }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: "admin",
      action: "booking.status_changed",
      entityType: "Booking",
      entityId: bookingId,
      outcome: "SUCCESS",
      beforeValue: booking.status,
      afterValue: data.status,
      summary: `Booking ${booking.bookingNumber} status changed from ${booking.status} to ${data.status}`,
    }),
  ]);

  revalidatePath(`/admin/bookings/${bookingId}`);
}

const notesSchema = z.object({
  planningNotes: z.preprocess(emptyToUndefined, z.string().optional()),
  internalNotes: z.preprocess(emptyToUndefined, z.string().optional()),
});

export async function updateBookingPlanningNotes(bookingId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const parsed = notesSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  await prisma.booking.update({ where: { id: bookingId }, data: parsed.data });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

// =============================================================================
// Stage J — Event Planning & Collaboration. Purely operational data hanging
// off bookingId — none of these ever touch Quote/Booking.agreedTotal/
// Invoice/Payment (§41/§42 financial isolation).
// =============================================================================

const timelineItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.preprocess(emptyToUndefined, z.string().optional()),
  date: z.preprocess(emptyToUndefined, z.string().optional()),
  time: z.preprocess(emptyToUndefined, z.string().optional()),
  type: z.preprocess(emptyToUndefined, z.string().optional()),
  sortOrder: z.preprocess(emptyToUndefined, z.coerce.number().int().optional()).default(0),
  clientVisible: z.preprocess((v) => v === "on" || v === "true", z.boolean()).default(false),
});

function combineDateTime(date?: string, time?: string): Date | null {
  if (!date) return null;
  return new Date(`${date}T${time || "00:00"}`);
}

export async function createTimelineItem(bookingId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const parsed = timelineItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  await prisma.eventTimelineItem.create({
    data: {
      bookingId,
      title: data.title,
      description: data.description,
      date: combineDateTime(data.date, data.time),
      type: data.type,
      sortOrder: data.sortOrder,
      clientVisible: data.clientVisible,
      createdBy: "admin",
    },
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function updateTimelineItem(itemId: string, bookingId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const parsed = timelineItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  await prisma.eventTimelineItem.update({
    where: { id: itemId },
    data: {
      title: data.title,
      description: data.description,
      date: combineDateTime(data.date, data.time),
      type: data.type,
      sortOrder: data.sortOrder,
      clientVisible: data.clientVisible,
      updatedBy: "admin",
    },
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
}

const timelineStatusSchema = z.object({ status: z.nativeEnum(EventTimelineStatus) });

export async function updateTimelineItemStatus(itemId: string, bookingId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const parsed = timelineStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const item = await prisma.eventTimelineItem.findUniqueOrThrow({ where: { id: itemId } });
  if (!isValidTimelineTransition(item.status, parsed.data.status)) return;

  await prisma.eventTimelineItem.update({
    where: { id: itemId },
    data: { status: parsed.data.status, updatedBy: "admin" },
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function deleteTimelineItem(itemId: string, bookingId: string) {
  await requireAdminRole("ADMIN");
  await prisma.eventTimelineItem.delete({ where: { id: itemId } });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

// Recommending a vendor to a booking is purely informational — there is no
// status, no confirmation, no engagement lifecycle. Moira recommends;
// clients decide (critical business rule — see schema comments).
const recommendVendorSchema = z.object({
  vendorRecommendationId: z.string().min(1, "Select a vendor recommendation"),
  serviceDescription: z.preprocess(emptyToUndefined, z.string().optional()),
  clientVisible: z.preprocess((v) => v === "on" || v === "true", z.boolean()).default(false),
});

export async function linkVendorToBooking(bookingId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const parsed = recommendVendorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  await prisma.bookingVendorRecommendation.create({
    data: {
      bookingId,
      vendorRecommendationId: data.vendorRecommendationId,
      serviceDescription: data.serviceDescription,
      clientVisible: data.clientVisible,
      createdBy: "admin",
    },
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
}

const updateRecommendationSchema = z.object({
  serviceDescription: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
  clientVisible: z.preprocess((v) => v === "on" || v === "true", z.boolean()).default(false),
});

export async function updateBookingVendor(bookingVendorRecommendationId: string, bookingId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const parsed = updateRecommendationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  await prisma.bookingVendorRecommendation.update({
    where: { id: bookingVendorRecommendationId },
    data: {
      serviceDescription: data.serviceDescription,
      notes: data.notes,
      clientVisible: data.clientVisible,
      updatedBy: "admin",
    },
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
}

// Removes the booking<->recommendation link only — the VendorRecommendation
// catalogue record is never touched here (§13/§21).
export async function unlinkVendorFromBooking(bookingVendorRecommendationId: string, bookingId: string) {
  await requireAdminRole("ADMIN");
  await prisma.bookingVendorRecommendation.delete({ where: { id: bookingVendorRecommendationId } });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

const planningNoteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
  clientVisible: z.preprocess((v) => v === "on" || v === "true", z.boolean()).default(false),
});

export async function addPlanningNote(bookingId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const parsed = planningNoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  await prisma.planningNote.create({
    data: { bookingId, content: parsed.data.content, clientVisible: parsed.data.clientVisible, createdBy: "admin" },
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function deletePlanningNote(noteId: string, bookingId: string) {
  await requireAdminRole("ADMIN");
  await prisma.planningNote.delete({ where: { id: noteId } });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function sendBookingConfirmationEmail(
  bookingId: string,
  _prevState: SendEmailFormState,
  formData: FormData,
): Promise<SendEmailFormState> {
  await requireAdminRole("ADMIN");
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return { status: "error", message: "Missing request id — please reload the page and try again." };

  const booking = await getBookingDetail(bookingId);
  if (!booking) return { status: "error", message: "Booking not found." };

  if (!isBookingSendable(booking.status)) {
    return { status: "error", message: `A booking in ${booking.status.replaceAll("_", " ")} status cannot be emailed to the client.` };
  }

  const client = booking.client;

  const result = await sendTrackedEmail({
    type: "BOOKING_CONFIRMATION",
    recipientEmail: client.email,
    relatedRecordType: "Booking",
    relatedRecordId: bookingId,
    idempotencyKey: `booking-confirmation:${bookingId}:${requestId}`,
    buildMessage: async () => {
      const doc = await getBookingDocumentForAdmin(bookingId);
      if (!doc) throw new Error("Booking document could not be built.");
      const pdf = await renderPdfBuffer(BookingPdf({ doc }));
      const template = bookingConfirmationEmail(client.fullName, booking.bookingNumber, formatDate(booking.eventDate), appUrl("/portal/event"));
      return { to: client.email, ...template, attachments: [{ filename: doc.filename, content: pdf }] };
    },
  });

  revalidatePath(`/admin/bookings/${bookingId}`);

  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: "admin",
    action: "email.booking_confirmation",
    entityType: "Booking",
    entityId: bookingId,
    outcome: result.status === "failed" ? "FAILURE" : "SUCCESS",
    correlationId: result.deliveryId,
    summary: `Booking confirmation ${booking.bookingNumber} emailed to ${client.email}${result.status === "failed" ? ` (failed: ${result.message ?? "unknown error"})` : ""}`,
  });

  if (result.status === "failed") {
    return { status: "error", message: `Failed to send: ${result.message ?? "unknown error"}` };
  }
  return { status: "success", message: `Booking confirmation sent to ${client.email}.` };
}
