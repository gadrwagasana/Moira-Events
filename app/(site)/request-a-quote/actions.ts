"use server";

import { z } from "zod";
import { createEnquiryRecord } from "@/lib/enquiries/createEnquiry";
import type { ReferencePrefix } from "@/lib/enquiries/reference";
import type { GeneralEnquiryState } from "./types";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

const contactMethodEnum = z.enum(["EMAIL", "PHONE", "WHATSAPP"]);
const divisionEnum = z.enum(["PARTY", "CORPORATE", "GENERAL"]);

const schema = z.object({
  division: divisionEnum,
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(1, "Phone is required"),
  whatsapp: z.preprocess(emptyToUndefined, z.string().optional()),
  preferredContactMethod: z.preprocess(emptyToUndefined, contactMethodEnum.optional()),
  // eventSubtype, eventDate, location, and the services/budget fields are
  // only rendered for Party/Corporate (hidden entirely for General) — must
  // tolerate being absent from FormData (null), not just empty ("").
  eventSubtype: z.preprocess(emptyToUndefined, z.string().optional()),
  eventDate: z.preprocess(emptyToUndefined, z.string().optional()),
  location: z.preprocess(emptyToUndefined, z.string().optional()),
  estimatedGuests: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  serviceIds: z.array(z.string()).default([]),
  otherServicesNote: z.preprocess(emptyToUndefined, z.string().optional()),
  budgetAmount: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
  budgetCurrency: z.preprocess(emptyToUndefined, z.string().optional()),
  message: z.string().min(1, "Please tell us a little about your event"),
});

const referencePrefixByDivision: Record<z.infer<typeof divisionEnum>, ReferencePrefix> = {
  PARTY: "MP",
  CORPORATE: "MC",
  GENERAL: "MG",
};

export async function submitGeneralEnquiry(
  _prevState: GeneralEnquiryState,
  formData: FormData,
): Promise<GeneralEnquiryState> {
  const raw = {
    division: formData.get("division"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    preferredContactMethod: formData.get("preferredContactMethod"),
    eventSubtype: formData.get("eventSubtype"),
    eventDate: formData.get("eventDate"),
    location: formData.get("location"),
    estimatedGuests: formData.get("estimatedGuests"),
    serviceIds: formData.getAll("serviceIds").map(String),
    otherServicesNote: formData.get("otherServicesNote"),
    budgetAmount: formData.get("budgetAmount"),
    budgetCurrency: formData.get("budgetCurrency"),
    message: formData.get("message"),
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (errors[key] ??= []).push(issue.message);
    }
    return { status: "error", errors };
  }

  const data = parsed.data;

  const result = await createEnquiryRecord({
    referencePrefix: referencePrefixByDivision[data.division],
    client: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      preferredContactMethod: data.preferredContactMethod,
    },
    event: {
      type: data.division,
      eventSubtype: data.eventSubtype,
      eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
      location: data.location,
      estimatedGuests: data.estimatedGuests,
    },
    enquiry: {
      budgetAmount: data.budgetAmount,
      budgetCurrency: data.budgetCurrency,
      otherServicesNote: data.otherServicesNote,
      message: data.message,
      serviceIds: data.serviceIds,
    },
  });

  if (!result.ok) {
    return { status: "error", errors: { form: ["Something went wrong. Please try again."] } };
  }

  return { status: "success", referenceNumber: result.referenceNumber, submittedAt: result.submittedAt };
}
