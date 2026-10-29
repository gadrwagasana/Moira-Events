import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { InvoiceStatus, Prisma } from "@/lib/generated/prisma/client";

export async function getInvoiceDetail(id: string) {
  return withDbRetry(() =>
    prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            client: true,
            event: true,
            weddingType: true,
            payments: true,
            invoices: { select: { id: true } },
          },
        },
        items: { orderBy: { sortOrder: "asc" }, include: { service: true } },
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    }),
  );
}

export async function getInvoicesList(filters: { q?: string; status?: string }) {
  const { q, status } = filters;

  const where: Prisma.InvoiceWhereInput = {
    ...(status && Object.values(InvoiceStatus).includes(status as InvoiceStatus)
      ? { status: status as InvoiceStatus }
      : {}),
    ...(q
      ? {
          OR: [
            { invoiceNumber: { contains: q, mode: "insensitive" } },
            { booking: { bookingNumber: { contains: q, mode: "insensitive" } } },
            { booking: { client: { fullName: { contains: q, mode: "insensitive" } } } },
            { booking: { client: { email: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  return prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { booking: { include: { client: true, payments: true } } },
  });
}
