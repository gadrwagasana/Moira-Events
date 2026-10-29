"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin/auth";

// Phase F security review: this action previously had NO authorization
// check at all — every other mutation in this admin area (see
// updateEnquiryStatus in ./actions.ts) requires requireAdminRole("ADMIN"),
// but this one was missed, meaning any request reaching this Server Action
// directly (bypassing the page's form entirely) could write a Communication
// row with zero authentication. Fixed to match the established convention
// for this area exactly.
export async function addCommunicationNote(enquiryId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const channel = String(formData.get("channel") ?? "Note");
  const message = String(formData.get("message") ?? "").trim();

  if (!message) return;

  await prisma.communication.create({
    data: { enquiryId, channel, message },
  });

  revalidatePath(`/admin/enquiries/${enquiryId}`);
}
