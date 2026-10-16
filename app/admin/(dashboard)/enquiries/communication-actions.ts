"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function addCommunicationNote(enquiryId: string, formData: FormData) {
  const channel = String(formData.get("channel") ?? "Note");
  const message = String(formData.get("message") ?? "").trim();

  if (!message) return;

  await prisma.communication.create({
    data: { enquiryId, channel, message },
  });

  revalidatePath(`/admin/enquiries/${enquiryId}`);
}
