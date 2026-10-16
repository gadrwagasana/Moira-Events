import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { generateReferenceNumber, type ReferencePrefix } from "./reference";

type ContactMethod = "EMAIL" | "PHONE" | "WHATSAPP";
type EventType = "WEDDING" | "PARTY" | "CORPORATE" | "GENERAL";

export type CreateEnquiryInput = {
  referencePrefix: ReferencePrefix;
  client: {
    fullName: string;
    email: string;
    phone?: string;
    whatsapp?: string;
    preferredContactMethod?: ContactMethod;
  };
  event: {
    type: EventType;
    weddingTypeId?: string;
    eventSubtype?: string;
    eventDate?: Date;
    location?: string;
    ceremonyLocation?: string;
    receptionLocation?: string;
    estimatedGuests?: number;
  };
  enquiry: {
    budgetAmount?: number;
    budgetCurrency?: string;
    otherServicesNote?: string;
    message?: string;
    serviceIds?: string[];
  };
};

export type CreateEnquiryResult =
  | { ok: true; referenceNumber: string; submittedAt: string }
  | { ok: false };

// Shared across every division's enquiry form (Weddings, the general
// Party/Corporate quote form, and Contact): upserts the client, creates the
// event, then creates the enquiry with a collision-safe reference number.
export async function createEnquiryRecord(input: CreateEnquiryInput): Promise<CreateEnquiryResult> {
  const client = await prisma.client.upsert({
    where: { email: input.client.email },
    update: {
      fullName: input.client.fullName,
      phone: input.client.phone,
      whatsapp: input.client.whatsapp,
      preferredContactMethod: input.client.preferredContactMethod,
    },
    create: {
      fullName: input.client.fullName,
      email: input.client.email,
      phone: input.client.phone,
      whatsapp: input.client.whatsapp,
      preferredContactMethod: input.client.preferredContactMethod,
    },
  });

  const event = await prisma.event.create({
    data: {
      clientId: client.id,
      type: input.event.type,
      weddingTypeId: input.event.weddingTypeId,
      eventSubtype: input.event.eventSubtype,
      eventDate: input.event.eventDate,
      location: input.event.location,
      ceremonyLocation: input.event.ceremonyLocation,
      receptionLocation: input.event.receptionLocation,
      estimatedGuests: input.event.estimatedGuests,
    },
  });

  // Reference numbers are date-based with a short random suffix; collisions
  // are only possible within the same day and are vanishingly rare, but the
  // unique constraint means a retry is cheap insurance.
  for (let attempt = 0; attempt < 3; attempt++) {
    const referenceNumber = generateReferenceNumber(input.referencePrefix);
    try {
      const enquiry = await prisma.enquiry.create({
        data: {
          referenceNumber,
          clientId: client.id,
          eventId: event.id,
          budgetAmount: input.enquiry.budgetAmount,
          budgetCurrency: input.enquiry.budgetCurrency,
          otherServicesNote: input.enquiry.otherServicesNote,
          message: input.enquiry.message,
          services: { create: (input.enquiry.serviceIds ?? []).map((serviceId) => ({ serviceId })) },
        },
      });
      return { ok: true, referenceNumber: enquiry.referenceNumber, submittedAt: enquiry.submittedAt.toISOString() };
    } catch (err) {
      const isReferenceCollision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        Array.isArray((err.meta as { target?: string[] } | undefined)?.target) &&
        (err.meta as { target?: string[] }).target?.includes("referenceNumber");
      if (!isReferenceCollision) {
        return { ok: false };
      }
      // else loop and retry with a freshly generated reference number
    }
  }

  return { ok: false };
}
