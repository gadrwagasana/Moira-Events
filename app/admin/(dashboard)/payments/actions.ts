"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { PaymentStatus, Prisma } from "@/lib/generated/prisma/client";
import { auditEventQuery, recordAuditEvent } from "@/lib/audit/log";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

const recordSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  currency: z.string().min(1, "Currency is required"),
  type: z.preprocess(emptyToUndefined, z.enum(["DEPOSIT", "PARTIAL", "FINAL"]).optional()),
  method: z.preprocess(emptyToUndefined, z.string().optional()),
  reference: z.preprocess(emptyToUndefined, z.string().optional()),
  paymentDate: z.preprocess(emptyToUndefined, z.string().optional()),
  // Defaults to PENDING via the form's own default — never silently PAID
  // just because a record was created (Stage G §4).
  status: z.nativeEnum(PaymentStatus),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

export async function recordPayment(bookingId: string, formData: FormData) {
  const parsed = recordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  const payment = await prisma.payment.create({
    data: {
      bookingId,
      amount: data.amount,
      currency: data.currency,
      type: data.type,
      method: data.method,
      reference: data.reference,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
      status: data.status,
      notes: data.notes,
      createdBy: "admin",
      statusHistory: {
        create: {
          previousStatus: null,
          newStatus: data.status,
          changedBy: "admin",
          note: "Payment recorded.",
        },
      },
    },
  });

  // Standalone (not transaction-wrapped, unlike updatePaymentStatus below)
  // — the Payment+statusHistory write above is already one atomic nested
  // Prisma create; there's no pre-existing array of top-level operations
  // to extend the way the status-transition actions have.
  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: "admin",
    action: "payment.recorded",
    entityType: "Payment",
    entityId: payment.id,
    outcome: "SUCCESS",
    summary: `Payment of ${data.amount} ${data.currency} recorded (${data.status})`,
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/payments");
}

const statusSchema = z.object({
  status: z.nativeEnum(PaymentStatus),
  changedBy: z.preprocess(emptyToUndefined, z.string().optional()),
  note: z.preprocess(emptyToUndefined, z.string().optional()),
  // Only meaningful (and only shown in the UI) when the new status is
  // REFUNDED/PARTIALLY_REFUNDED — architecture per §10, never auto-filled.
  refundAmount: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
  refundDate: z.preprocess(emptyToUndefined, z.string().optional()),
  refundReference: z.preprocess(emptyToUndefined, z.string().optional()),
  refundReason: z.preprocess(emptyToUndefined, z.string().optional()),
});

export async function updatePaymentStatus(paymentId: string, formData: FormData) {
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });

  const updateData: Prisma.PaymentUpdateInput = { status: data.status, updatedBy: data.changedBy };

  if (data.status === "REFUNDED" || data.status === "PARTIALLY_REFUNDED") {
    updateData.refundAmount = data.refundAmount;
    updateData.refundDate = data.refundDate ? new Date(data.refundDate) : undefined;
    updateData.refundReference = data.refundReference;
    updateData.refundReason = data.refundReason;
  }

  await prisma.$transaction([
    prisma.payment.update({ where: { id: paymentId }, data: updateData }),
    prisma.paymentStatusHistory.create({
      data: {
        paymentId,
        previousStatus: payment.status,
        newStatus: data.status,
        changedBy: data.changedBy,
        note: data.note,
      },
    }),
    // summary intentionally omits refundReference/refundReason — free-text
    // fields that could carry an operationally-sensitive payment-processor
    // reference; only the enum-like status values are recorded.
    auditEventQuery({
      actorType: "ADMIN",
      actorId: "admin",
      action: "payment.status_changed",
      entityType: "Payment",
      entityId: paymentId,
      outcome: "SUCCESS",
      beforeValue: payment.status,
      afterValue: data.status,
      summary: `Payment status changed from ${payment.status} to ${data.status}`,
    }),
  ]);

  revalidatePath(`/admin/payments/${paymentId}`);
  revalidatePath(`/admin/bookings/${payment.bookingId}`);
}
