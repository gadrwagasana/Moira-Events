import { prisma } from "@/lib/db";
import { AuditActorType, Prisma } from "@/lib/generated/prisma/client";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "./constants";

export async function getAuditEventsList(
  filters: {
    entityType?: string;
    action?: string;
    actorType?: string;
    entityId?: string;
    from?: string;
    to?: string;
  },
  take = 200,
) {
  const { entityType, action, actorType, entityId, from, to } = filters;

  const where: Prisma.AuditEventWhereInput = {
    ...(entityType && AUDIT_ENTITY_TYPES.includes(entityType as (typeof AUDIT_ENTITY_TYPES)[number])
      ? { entityType }
      : {}),
    ...(action && AUDIT_ACTIONS.includes(action as (typeof AUDIT_ACTIONS)[number]) ? { action } : {}),
    ...(actorType && Object.values(AuditActorType).includes(actorType as AuditActorType)
      ? { actorType: actorType as AuditActorType }
      : {}),
    ...(entityId ? { entityId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
  };

  return prisma.auditEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
  });
}
