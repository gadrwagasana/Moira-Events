"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ConsultationStatus, ConsultationMethod } from "@/lib/generated/prisma/client";
import { isValidTransition } from "@/lib/consultations/transitions";
import { requireAdminRole } from "@/lib/admin/auth";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

const statusSchema = z.object({
  status: z.nativeEnum(ConsultationStatus),
  changedBy: z.preprocess(emptyToUndefined, z.string().optional()),
  note: z.preprocess(emptyToUndefined, z.string().optional()),
});

export async function updateConsultationStatus(consultationId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  const consultation = await prisma.consultation.findUniqueOrThrow({ where: { id: consultationId } });

  if (!isValidTransition(consultation.status, data.status)) return;

  await prisma.$transaction([
    prisma.consultation.update({ where: { id: consultationId }, data: { status: data.status } }),
    prisma.consultationStatusHistory.create({
      data: {
        consultationId,
        previousStatus: consultation.status,
        newStatus: data.status,
        changedBy: data.changedBy,
        note: data.note,
      },
    }),
  ]);

  revalidatePath(`/admin/consultations/${consultationId}`);
  revalidatePath("/admin/consultations");
}

const rescheduleSchema = z.object({
  scheduledDate: z.string().min(1, "Date is required"),
  scheduledTime: z.preprocess(emptyToUndefined, z.string().optional()),
  method: z.preprocess(emptyToUndefined, z.nativeEnum(ConsultationMethod).optional()),
  changedBy: z.preprocess(emptyToUndefined, z.string().optional()),
  note: z.preprocess(emptyToUndefined, z.string().optional()),
});

// Rescheduling only moves scheduledDate (admin's confirmed date) — it never
// touches preferredDate (what the client originally asked for), and it is
// deliberately independent of status: a REQUESTED consultation can be given
// a scheduled date before it's formally confirmed, and an already-CONFIRMED
// one can be moved without losing its CONFIRMED status.
export async function rescheduleConsultation(consultationId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const consultation = await prisma.consultation.findUniqueOrThrow({ where: { id: consultationId } });
  if (consultation.status === "COMPLETED" || consultation.status === "CANCELLED") return;

  const parsed = rescheduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  const scheduledDate = new Date(`${data.scheduledDate}T${data.scheduledTime || "00:00"}`);

  await prisma.$transaction([
    prisma.consultation.update({
      where: { id: consultationId },
      data: { scheduledDate, method: data.method ?? consultation.method },
    }),
    prisma.consultationStatusHistory.create({
      data: {
        consultationId,
        previousStatus: consultation.status,
        newStatus: consultation.status,
        changedBy: data.changedBy,
        note: data.note
          ? `Rescheduled to ${scheduledDate.toLocaleString()}: ${data.note}`
          : `Rescheduled to ${scheduledDate.toLocaleString()}`,
      },
    }),
  ]);

  revalidatePath(`/admin/consultations/${consultationId}`);
  revalidatePath("/admin/consultations");
}
