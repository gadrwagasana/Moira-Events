import { prisma } from "@/lib/db";
import { DocumentType, Prisma } from "@/lib/generated/prisma/client";

export async function getDocumentRecordsList(filters: { type?: string; reference?: string; relatedRecordId?: string }) {
  const { type, reference, relatedRecordId } = filters;

  const where: Prisma.DocumentRecordWhereInput = {
    ...(type && Object.values(DocumentType).includes(type as DocumentType) ? { type: type as DocumentType } : {}),
    ...(reference ? { referenceNumber: { contains: reference, mode: "insensitive" } } : {}),
    ...(relatedRecordId ? { relatedRecordId } : {}),
  };

  return prisma.documentRecord.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
