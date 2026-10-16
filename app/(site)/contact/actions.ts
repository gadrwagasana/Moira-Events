"use server";

import { z } from "zod";
import { createEnquiryRecord } from "@/lib/enquiries/createEnquiry";
import type { ContactState } from "./types";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.preprocess(emptyToUndefined, z.string().optional()),
  message: z.string().min(1, "Please enter a message"),
});

export async function submitContactMessage(_prevState: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse({
    fullName: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
  });

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
    referencePrefix: "MG",
    client: { fullName: data.fullName, email: data.email, phone: data.phone },
    event: { type: "GENERAL" },
    enquiry: { message: data.message },
  });

  if (!result.ok) {
    return { status: "error", errors: { form: ["Something went wrong. Please try again."] } };
  }

  return { status: "success" };
}
