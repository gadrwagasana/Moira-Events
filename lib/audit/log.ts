import { prisma } from "@/lib/db";
import type { Prisma, AuditEvent, AuditActorType, AuditOutcome } from "@/lib/generated/prisma/client";
import type { AuditAction, AuditEntityType } from "./constants";

export type AuditEventArgs = {
  actorType: AuditActorType;
  actorId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  outcome: AuditOutcome;
  correlationId?: string;
  summary: string;
  beforeValue?: string;
  afterValue?: string;
};

// Raw PrismaPromise, not awaited here — intended for use as an additional
// element inside an existing prisma.$transaction([update, historyCreate,
// auditEventQuery(...)]) array, so the business write and its audit record
// commit or roll back together using an idiom already native to this
// codebase (updateBookingStatus/updateInvoiceStatus/updatePaymentStatus all
// already use this array form). Do NOT wrap this in try/catch — a
// transaction element that swallows its own errors would defeat rollback.
export function auditEventQuery(args: AuditEventArgs): Prisma.PrismaPromise<AuditEvent> {
  return prisma.auditEvent.create({ data: { ...args } });
}

// Safe wrapper for genuinely standalone call sites (PDF routes, email-
// outcome recording) where there's no sibling business write to be atomic
// with — never throws. Residual gap, stated plainly rather than assumed
// away: this project has no Sentry/pino/winston, so a failed write here is
// only visible to someone tailing server logs.
export async function recordAuditEvent(args: AuditEventArgs): Promise<void> {
  try {
    await auditEventQuery(args);
  } catch (err) {
    console.error("[audit] failed to record event:", args.action, err instanceof Error ? err.message : err);
  }
}
