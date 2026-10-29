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
//
// The entire body is wrapped in one try/catch (not just the final
// enquiry.create call, which is all the previous version protected) —
// found during the production React-error-#441 investigation: the
// client.upsert and event.create calls had no error handling at all, so a
// transient database error during either of them (the suspected root
// cause: a Neon/serverless connection hiccup, see SETUP.md and
// app/(site)/request-a-quote/page.tsx's own GET-path fix) propagated
// uncaught out of this function, out of the calling Server Action, and
// into an unhandled Server Function error — exactly how #441 manifests.
// That GET-path fix only covered the service-catalogue fetch on page
// load; it never touched this separate, submit-time code path, which is
// why the crash kept happening even after that earlier mitigation.
export async function createEnquiryRecord(input: CreateEnquiryInput): Promise<CreateEnquiryResult> {
  try {
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

    // Reference numbers are date-based with a short random suffix;
    // collisions are only possible within the same day and are vanishingly
    // rare, but the unique constraint means a retry is cheap insurance.
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
  } catch (err) {
    console.error("[createEnquiryRecord] failed:", err instanceof Error ? err.message : err);
    return { ok: false };
  }
}
