"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { generateReferenceNumber } from "@/lib/enquiries/reference";
import type { ConsultationState } from "./types";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(1, "Phone is required"),
  eventType: z.enum(["WEDDING", "PARTY", "CORPORATE", "GENERAL"]),
  method: z.preprocess(
    emptyToUndefined,
    z.enum(["IN_PERSON", "PHONE", "WHATSAPP", "VIDEO_CALL"]).optional(),
  ),
  preferredDate: z.preprocess(emptyToUndefined, z.string().optional()),
  preferredTime: z.preprocess(emptyToUndefined, z.string().optional()),
  message: z.preprocess(emptyToUndefined, z.string().optional()),
});

export async function submitConsultationRequest(
  _prevState: ConsultationState,
  formData: FormData,
): Promise<ConsultationState> {
  const parsed = schema.safeParse({
    fullName: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    eventType: formData.get("eventType"),
    method: formData.get("method"),
    preferredDate: formData.get("preferredDate"),
    preferredTime: formData.get("preferredTime"),
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

  const client = await prisma.client.upsert({
    where: { email: data.email },
    update: { fullName: data.fullName, phone: data.phone },
    create: { fullName: data.fullName, email: data.email, phone: data.phone },
  });

  const preferredDate = data.preferredDate
    ? new Date(`${data.preferredDate}T${data.preferredTime || "00:00"}`)
    : undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
    const referenceNumber = generateReferenceNumber("MV");
    try {
      const consultation = await prisma.consultation.create({
        data: {
          referenceNumber,
          clientId: client.id,
          eventType: data.eventType,
          method: data.method,
          preferredDate,
          notes: data.message,
        },
      });
      return { status: "success", referenceNumber: consultation.referenceNumber };
    } catch (err) {
      const isReferenceCollision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        Array.isArray((err.meta as { target?: string[] } | undefined)?.target) &&
        (err.meta as { target?: string[] }).target?.includes("referenceNumber");
      if (!isReferenceCollision) {
        return { status: "error", errors: { form: ["Something went wrong. Please try again."] } };
      }
    }
  }

  return { status: "error", errors: { form: ["Something went wrong. Please try again."] } };
}
