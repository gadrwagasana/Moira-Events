import { Prisma } from "@/lib/generated/prisma/client";

type ItemLike = { quantity?: number | null; unitPrice?: Prisma.Decimal | number | string | null };

// Shared by every action that touches line items or discount/tax, so the
// stored subtotal/total always matches the line items — never computed once
// and left to drift, and never an invented tax rate (Stage E §5).
export function computeQuoteTotals(
  items: ItemLike[],
  discountAmount?: Prisma.Decimal | number | string | null,
  taxAmount?: Prisma.Decimal | number | string | null,
) {
  const subtotal = items.reduce((sum, item) => {
    const qty = item.quantity ?? 1;
    const price = item.unitPrice ? Number(item.unitPrice) : 0;
    return sum + qty * price;
  }, 0);

  const discount = discountAmount ? Number(discountAmount) : 0;
  const tax = taxAmount ? Number(taxAmount) : 0;
  const totalAmount = Math.max(0, subtotal - discount + tax);

  return { subtotal, totalAmount };
}
