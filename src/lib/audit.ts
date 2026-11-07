import "server-only";
import { prisma, type Tx } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function audit(
  entry: { actorId?: string | null; action: string; entity: string; entityId?: string | null; data?: Prisma.InputJsonValue; ip?: string | null },
  tx: Tx | typeof prisma = prisma,
) {
  await tx.auditLog.create({ data: { ...entry, actorId: entry.actorId ?? null } });
}
