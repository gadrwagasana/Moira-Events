import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import type { AuditActorType, DocumentType } from "@/lib/generated/prisma/client";
import { recordAuditEvent } from "@/lib/audit/log";

// Called by all 6 PDF route handlers, only after a document was actually
// built (never on a 404/not-owned) — size and checksum are computed from
// the already-rendered buffer at zero extra cost, the one piece of real
// forensic value a metadata-only registry offers.
export async function recordDocumentGenerated(args: {
  type: DocumentType;
  relatedRecordId: string;
  referenceNumber: string;
  version?: number;
  filename: string;
  buffer: Buffer;
  actorType: AuditActorType;
  actorId: string;
}): Promise<void> {
  const fileSizeBytes = args.buffer.length;
  const checksumSha256 = createHash("sha256").update(args.buffer).digest("hex");

  try {
    const doc = await prisma.documentRecord.create({
      data: {
        type: args.type,
        relatedRecordId: args.relatedRecordId,
        referenceNumber: args.referenceNumber,
        version: args.version,
        filename: args.filename,
        fileSizeBytes,
        checksumSha256,
        actorType: args.actorType,
        actorId: args.actorId,
      },
    });

    await recordAuditEvent({
      actorType: args.actorType,
      actorId: args.actorId,
      action: "document.generated",
      entityType: "Document",
      entityId: doc.id,
      outcome: "SUCCESS",
      correlationId: args.relatedRecordId,
      summary: `${args.type.replaceAll("_", " ")} document generated (${args.referenceNumber})`,
    });
  } catch (err) {
    // Never block the actual PDF response on a logging failure — the
    // client/admin already has their document; this is best-effort.
    console.error("[documents] failed to record document generation:", err instanceof Error ? err.message : err);
  }
}
