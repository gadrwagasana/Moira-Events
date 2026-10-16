import { siteConfig } from "@/lib/content/config";

// Presentation structures only — never a replacement for the database
// records they're built from (Stage L1 §22). Deliberately typed to contain
// ONLY client-safe fields: because both the admin loader (which includes
// internalNotes) and the portal loader (which already excludes it) are fed
// through the same mapper, and that mapper's input type never declares
// internalNotes as a field it reads, internal data is structurally
// unreachable from the PDF — not just filtered at runtime (§27/§28).

export type CompanyInfo = {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  country: string;
};

// Built once from already-confirmed business info (lib/content/config.ts) —
// no address/VAT/bank details invented (§11).
export function getCompanyInfo(): CompanyInfo {
  return {
    name: siteConfig.name,
    tagline: siteConfig.tagline,
    email: siteConfig.email,
    phone: siteConfig.phone,
    country: siteConfig.country,
  };
}

export type DocumentItem = {
  description: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number | null;
  lineTotal: number | null;
};

export type ClientInfo = {
  fullName: string;
  email: string;
  phone: string | null;
};

export type EventInfo = {
  eventType: string | null;
  weddingTypeName: string | null;
  eventDate: Date | null;
  location: string | null;
  estimatedGuests: number | null;
};

export type QuoteDocument = {
  documentNumber: string;
  version: number;
  status: string;
  issueDate: Date | null;
  expiresAt: Date | null;
  currency: string | null;
  client: ClientInfo;
  event: EventInfo;
  items: DocumentItem[];
  subtotal: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  clientNotes: string | null;
  terms: string | null;
  company: CompanyInfo;
  filename: string;
};

export type InvoiceDocument = {
  documentNumber: string;
  status: string;
  issueDate: Date | null;
  dueDate: Date | null;
  currency: string | null;
  client: ClientInfo;
  event: EventInfo;
  items: DocumentItem[];
  subtotal: number | null;
  discount: number | null;
  tax: number | null;
  total: number | null;
  totalPaid: number;
  outstandingBalance: number;
  paymentState: string;
  clientNotes: string | null;
  terms: string | null;
  company: CompanyInfo;
  filename: string;
};

export type BookingDocument = {
  documentNumber: string;
  status: string;
  client: ClientInfo;
  event: EventInfo;
  services: DocumentItem[];
  agreedTotal: number | null;
  currency: string | null;
  company: CompanyInfo;
  filename: string;
};
