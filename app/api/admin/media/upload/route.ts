import { NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin/auth";
import { performMediaUpload } from "@/lib/media/service";

// Exists specifically so the drag-and-drop admin uploader can track real
// upload progress via XMLHttpRequest's upload.onprogress — a Server Action
// invocation doesn't expose byte-level progress events to the browser, but
// a plain POST to a route does. Same authorization and upload logic as the
// Server Action path (lib/media/actions.ts's uploadMediaAsset) — both call
// lib/media/service.ts's performMediaUpload, so they can't drift apart.
export async function POST(request: Request) {
  const admin = await requireAdminRole("EDITOR");

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ status: "error", message: "No file was provided." }, { status: 400 });
  }
  const altTextRaw = formData.get("altText");
  const altText = typeof altTextRaw === "string" && altTextRaw.trim() ? altTextRaw.trim().slice(0, 200) : undefined;

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await performMediaUpload(admin, buffer, altText);

  return NextResponse.json(result, { status: result.status === "success" ? 200 : 400 });
}
