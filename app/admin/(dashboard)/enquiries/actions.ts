"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { EnquiryStatus } from "@/lib/generated/prisma/client";
import { requireAdminRole } from "@/lib/admin/auth";

const validStatuses = new Set<string>(Object.values(EnquiryStatus));

export async function updateEnquiryStatus(enquiryId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const status = String(formData.get("status") ?? "");
  if (!validStatuses.has(status)) {
    throw new Error("Invalid status");
  }

  await prisma.enquiry.update({
    where: { id: enquiryId },
    data: { status: status as EnquiryStatus },
  });

  revalidatePath(`/admin/enquiries/${enquiryId}`);
  revalidatePath("/admin/enquiries");
}
