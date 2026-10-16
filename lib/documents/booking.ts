import { getBookingDetail } from "@/lib/bookings/data";
import { getPrimaryBookingForClient, getClientProfile } from "@/lib/client-portal/data";
import { buildFilename } from "./format";
import { getCompanyInfo, type BookingDocument, type DocumentItem } from "./types";

type BookingSource = {
  bookingNumber: string;
  status: string;
  agreedTotal: unknown;
  currency: string | null;
  estimatedGuests: number | null;
  eventDate: Date | null;
  location: string | null;
  weddingType?: { name: string } | null;
  event?: { type: string } | null;
  services: { description: string; quantity: number | null; unit?: string | null; unitPrice: unknown; total: unknown }[];
};

type ClientSource = { fullName: string; email: string; phone: string | null };

function toNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function toServices(services: BookingSource["services"]): DocumentItem[] {
  return services.map((s) => ({
    description: s.description,
    quantity: s.quantity ?? 1,
    unit: s.unit,
    unitPrice: toNumber(s.unitPrice),
    lineTotal: toNumber(s.total),
  }));
}

function toBookingDocument(booking: BookingSource, client: ClientSource): BookingDocument {
  return {
    documentNumber: booking.bookingNumber,
    status: booking.status.replaceAll("_", " "),
    client: { fullName: client.fullName, email: client.email, phone: client.phone },
    event: {
      eventType: booking.event?.type ?? null,
      weddingTypeName: booking.weddingType?.name ?? null,
      eventDate: booking.eventDate,
      location: booking.location,
      estimatedGuests: booking.estimatedGuests,
    },
    services: toServices(booking.services),
    agreedTotal: toNumber(booking.agreedTotal),
    currency: booking.currency,
    company: getCompanyInfo(),
    filename: buildFilename("booking", booking.bookingNumber),
  };
}

export async function getBookingDocumentForAdmin(bookingId: string): Promise<BookingDocument | null> {
  const booking = await getBookingDetail(bookingId);
  if (!booking) return null;
  return toBookingDocument(booking, booking.client);
}

// No bookingId param — mirrors /portal/event itself (primary booking only).
export async function getBookingDocumentForClient(clientId: string): Promise<BookingDocument | null> {
  const booking = await getPrimaryBookingForClient(clientId);
  if (!booking) return null;

  const client = await getClientProfile(clientId);
  if (!client) return null;

  return toBookingDocument(booking, client);
}
