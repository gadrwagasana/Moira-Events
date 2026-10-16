"use server";

import { z } from "zod";
import { createEnquiryRecord } from "@/lib/enquiries/createEnquiry";
import type { WeddingEnquiryState } from "./types";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

const contactMethodEnum = z.enum(["EMAIL", "PHONE", "WHATSAPP"]);

// Keep in sync with lib/content/wedding-enquiry-fields.ts — that file is the
// source of truth for which fields are required; this schema enforces it.
const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(1, "Phone is required"),
  whatsapp: z.preprocess(emptyToUndefined, z.string().optional()),
  preferredContactMethod: z.preprocess(emptyToUndefined, contactMethodEnum.optional()),
  weddingTypeId: z.string().min(1, "Please select a wedding type"),
  weddingDate: z.preprocess(emptyToUndefined, z.string().optional()),
  location: z.preprocess(emptyToUndefined, z.string().optional()),
  ceremonyLocation: z.preprocess(emptyToUndefined, z.string().optional()),
  receptionLocation: z.preprocess(emptyToUndefined, z.string().optional()),
  estimatedGuests: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  serviceIds: z.array(z.string()).default([]),
  // Only present in FormData when the "Other" checkbox is checked (the
  // textarea isn't rendered otherwise) — must tolerate null, not just "".
  otherServicesNote: z.preprocess(emptyToUndefined, z.string().optional()),
  budgetAmount: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
  budgetCurrency: z.preprocess(emptyToUndefined, z.string().optional()),
  message: z.preprocess(emptyToUndefined, z.string().optional()),
});

export async function submitWeddingEnquiry(
  _prevState: WeddingEnquiryState,
  formData: FormData,
): Promise<WeddingEnquiryState> {
  const raw = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    preferredContactMethod: formData.get("preferredContactMethod"),
    weddingTypeId: formData.get("weddingTypeId"),
    weddingDate: formData.get("weddingDate"),
    location: formData.get("location"),
    ceremonyLocation: formData.get("ceremonyLocation"),
    receptionLocation: formData.get("receptionLocation"),
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
    referencePrefix: "MW",
    client: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      preferredContactMethod: data.preferredContactMethod,
    },
    event: {
      type: "WEDDING",
      weddingTypeId: data.weddingTypeId,
      eventDate: data.weddingDate ? new Date(data.weddingDate) : undefined,
      location: data.location,
      ceremonyLocation: data.ceremonyLocation,
      receptionLocation: data.receptionLocation,
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
