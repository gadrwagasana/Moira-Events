import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { PaymentStatus, Prisma } from "@/lib/generated/prisma/client";

export async function getPaymentDetail(id: string) {
  return withDbRetry(() =>
    prisma.payment.findUnique({
      where: { id },
      include: {
        booking: { include: { client: true, event: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    }),
  );
}

export async function getPaymentsList(filters: { q?: string; status?: string; source?: string }) {
  const { q, status, source } = filters;

  const where: Prisma.PaymentWhereInput = {
    ...(status && Object.values(PaymentStatus).includes(status as PaymentStatus)
      ? { status: status as PaymentStatus }
      : {}),
    // Stage N — `provider` already existed as a nullable gateway-readiness
    // field; it now doubles as the Manual/Online discriminator for free.
    ...(source === "online" ? { provider: { not: null } } : source === "manual" ? { provider: null } : {}),
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { booking: { bookingNumber: { contains: q, mode: "insensitive" } } },
            { booking: { client: { fullName: { contains: q, mode: "insensitive" } } } },
            { booking: { client: { email: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  return prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { booking: { include: { client: true } } },
  });
}
