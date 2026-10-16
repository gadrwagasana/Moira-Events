import { getInvoiceDetail } from "@/lib/invoices/data";
import { getInvoiceDetailForClient, getBookingDetailForClient, getClientProfile } from "@/lib/client-portal/data";
import { computePaymentSummary } from "@/lib/payments/totals";
import { buildFilename } from "./format";
import { getCompanyInfo, type InvoiceDocument, type DocumentItem } from "./types";

// Same structural-safety rationale as quote.ts — this type only ever
// declares the client-safe fields an Invoice PDF needs.
type InvoiceSource = {
  invoiceNumber: string;
  status: string;
  issueDate: Date | null;
  dueDate: Date | null;
  currency: string | null;
  subtotal: unknown;
  discount: unknown;
  tax: unknown;
  total: unknown;
  clientNotes: string | null;
  terms: string | null;
  items: { description: string; quantity: number | null; unitPrice: unknown; lineTotal: unknown }[];
};

type ClientSource = { fullName: string; email: string; phone: string | null };
type EventSource = {
  type: string | null;
  weddingTypeName: string | null;
  eventDate: Date | null;
  location: string | null;
};
type PaymentSource = { amount: unknown; status: string; refundAmount: unknown };

function toNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function toItems(items: InvoiceSource["items"]): DocumentItem[] {
  return items.map((i) => ({
    description: i.description,
    quantity: i.quantity ?? 1,
    unitPrice: toNumber(i.unitPrice),
    lineTotal: toNumber(i.lineTotal),
  }));
}

function toInvoiceDocument(
  invoice: InvoiceSource,
  client: ClientSource,
  event: EventSource,
  payments: PaymentSource[],
): InvoiceDocument {
  // Reuses the exact same Stage G ledger math the admin/portal pages already
  // use — no second payment calculation (Stage L1 §5/§35).
  const summary = computePaymentSummary(
    invoice.total as Parameters<typeof computePaymentSummary>[0],
    payments as Parameters<typeof computePaymentSummary>[1],
  );

  return {
    documentNumber: invoice.invoiceNumber,
    status: invoice.status.replaceAll("_", " "),
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    client: { fullName: client.fullName, email: client.email, phone: client.phone },
    event: {
      eventType: event.type,
      weddingTypeName: event.weddingTypeName,
      eventDate: event.eventDate,
      location: event.location,
      estimatedGuests: null,
    },
    items: toItems(invoice.items),
    subtotal: toNumber(invoice.subtotal),
    discount: toNumber(invoice.discount),
    tax: toNumber(invoice.tax),
    total: toNumber(invoice.total),
    totalPaid: summary.totalPaid,
    outstandingBalance: summary.outstandingBalance,
    paymentState: summary.state.replaceAll("_", " "),
    clientNotes: invoice.clientNotes,
    terms: invoice.terms,
    company: getCompanyInfo(),
    filename: buildFilename("invoice", invoice.invoiceNumber),
  };
}

export async function getInvoiceDocumentForAdmin(invoiceId: string): Promise<InvoiceDocument | null> {
  const invoice = await getInvoiceDetail(invoiceId);
  if (!invoice) return null;

  const { booking } = invoice;
  return toInvoiceDocument(
    invoice,
    booking.client,
    {
      type: booking.event?.type ?? null,
      weddingTypeName: booking.weddingType?.name ?? null,
      eventDate: booking.eventDate,
      location: booking.location,
    },
    booking.payments,
  );
}

export async function getInvoiceDocumentForClient(clientId: string, invoiceId: string): Promise<InvoiceDocument | null> {
  const invoice = await getInvoiceDetailForClient(clientId, invoiceId);
  if (!invoice) return null;

  const [booking, client] = await Promise.all([
    getBookingDetailForClient(clientId, invoice.booking.id),
    getClientProfile(clientId),
  ]);
  if (!booking || !client) return null;

  return toInvoiceDocument(
    invoice,
    client,
    {
      type: booking.event?.type ?? null,
      weddingTypeName: booking.weddingType?.name ?? null,
      eventDate: booking.eventDate,
      location: booking.location,
    },
    invoice.booking.payments,
  );
}
