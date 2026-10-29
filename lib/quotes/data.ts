import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { QuoteStatus, Prisma } from "@/lib/generated/prisma/client";

export async function getQuoteDetail(id: string) {
  return withDbRetry(() =>
    prisma.quote.findUnique({
      where: { id },
      include: {
        enquiry: {
          include: {
            client: true,
            event: { include: { weddingType: true } },
          },
        },
        items: { orderBy: { sortOrder: "asc" }, include: { service: true } },
        revisions: { orderBy: { createdAt: "desc" } },
        booking: true,
      },
    }),
  );
}

export async function getQuotesList(filters: { q?: string; status?: string }) {
  const { q, status } = filters;

  const where: Prisma.QuoteWhereInput = {
    ...(status && Object.values(QuoteStatus).includes(status as QuoteStatus)
      ? { status: status as QuoteStatus }
      : {}),
    ...(q
      ? {
          OR: [
            { quoteNumber: { contains: q, mode: "insensitive" } },
            { enquiry: { client: { fullName: { contains: q, mode: "insensitive" } } } },
            { enquiry: { client: { email: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  return prisma.quote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      enquiry: { include: { client: true, event: true } },
    },
  });
}
