import { getQuoteDetail } from "@/lib/quotes/data";
import { getPrimaryBookingForClient, getQuoteForClientBooking, getClientProfile } from "@/lib/client-portal/data";
import { buildFilename } from "./format";
import { getCompanyInfo, type QuoteDocument, type DocumentItem } from "./types";

// Deliberately typed to only the client-safe fields a Quote PDF ever needs —
// both the admin's full `getQuoteDetail` result and the portal's narrower
// `getQuoteForClientBooking` result satisfy this shape, so internalNotes
// (present on the admin object) is structurally unreachable here.
type QuoteSource = {
  quoteNumber: string;
  version: number;
  status: string;
  issueDate: Date | null;
  expiresAt: Date | null;
  currency: string | null;
  subtotal: unknown;
  discountAmount: unknown;
  taxAmount: unknown;
  totalAmount: unknown;
  clientNotes: string | null;
  terms: string | null;
  items: { description: string; quantity: number | null; unit: string | null; unitPrice: unknown; total: unknown }[];
};

type ClientSource = { fullName: string; email: string; phone: string | null };
type EventSource = {
  type: string | null;
  weddingTypeName: string | null;
  eventDate: Date | null;
  location: string | null;
  estimatedGuests: number | null;
};

function toNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function toItems(items: QuoteSource["items"]): DocumentItem[] {
  return items.map((i) => ({
    description: i.description,
    quantity: i.quantity ?? 1,
    unit: i.unit,
    unitPrice: toNumber(i.unitPrice),
    lineTotal: toNumber(i.total),
  }));
}

function toQuoteDocument(quote: QuoteSource, client: ClientSource, event: EventSource): QuoteDocument {
  return {
    documentNumber: quote.quoteNumber,
    version: quote.version,
    status: quote.status.replaceAll("_", " "),
    issueDate: quote.issueDate,
    expiresAt: quote.expiresAt,
    currency: quote.currency,
    client: { fullName: client.fullName, email: client.email, phone: client.phone },
    event: {
      eventType: event.type,
      weddingTypeName: event.weddingTypeName,
      eventDate: event.eventDate,
      location: event.location,
      estimatedGuests: event.estimatedGuests,
    },
    items: toItems(quote.items),
    subtotal: toNumber(quote.subtotal),
    discountAmount: toNumber(quote.discountAmount),
    taxAmount: toNumber(quote.taxAmount),
    totalAmount: toNumber(quote.totalAmount),
    clientNotes: quote.clientNotes,
    terms: quote.terms,
    company: getCompanyInfo(),
    filename: buildFilename("quote", quote.quoteNumber, quote.version),
  };
}

export async function getQuoteDocumentForAdmin(quoteId: string): Promise<QuoteDocument | null> {
  const quote = await getQuoteDetail(quoteId);
  if (!quote) return null;

  const { client, event } = quote.enquiry;
  return toQuoteDocument(quote, client, {
    type: event.type,
    weddingTypeName: event.weddingType?.name ?? null,
    eventDate: event.eventDate,
    location: event.location,
    estimatedGuests: event.estimatedGuests,
  });
}

// No quoteId param — mirrors /portal/quote itself, which always shows the
// quote attached to the client's primary booking (Stage I scoping decision).
export async function getQuoteDocumentForClient(clientId: string): Promise<QuoteDocument | null> {
  const booking = await getPrimaryBookingForClient(clientId);
  if (!booking) return null;

  const quote = await getQuoteForClientBooking(clientId, booking.id);
  if (!quote) return null;

  const client = await getClientProfile(clientId);
  if (!client) return null;

  return toQuoteDocument(quote, client, {
    type: booking.event?.type ?? null,
    weddingTypeName: booking.weddingType?.name ?? null,
    eventDate: booking.eventDate,
    location: booking.location,
    estimatedGuests: booking.estimatedGuests,
  });
}
