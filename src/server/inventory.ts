import type { PrismaClient, StockReason } from "@/generated/prisma/client";
import { DomainError } from "@/server/errors";

/** Atomic manual stock adjustment with audit trail. Never allows negative stock. */
export async function adjustStock(
  db: PrismaClient,
  input: { variantId: string; mode: "delta" | "set"; value: number; reason: StockReason; note?: string | null; actorId: string | null },
) {
  if (!Number.isInteger(input.value)) throw new DomainError("قيمة غير صالحة");
  if (input.mode === "set" && input.value < 0) throw new DomainError("لا يمكن أن يكون المخزون سالباً");
  return db.$transaction(async (tx) => {
    const v = await tx.productVariant.findUnique({ where: { id: input.variantId }, select: { id: true, stock: true } });
    if (!v) throw new DomainError("المتغير غير موجود");
    const delta = input.mode === "set" ? input.value - v.stock : input.value;
    if (delta === 0) return { stock: v.stock, delta: 0 };
    const res = await tx.productVariant.updateMany({
      where: { id: v.id, stock: input.mode === "set" ? v.stock : delta < 0 ? { gte: -delta } : undefined },
      data: { stock: { increment: delta } },
    });
    if (res.count !== 1) throw new DomainError("تغيّر المخزون أثناء التعديل أو أصبحت الكمية سالبة، حدّثي الصفحة وأعيدي المحاولة");
    const after = await tx.productVariant.findUniqueOrThrow({ where: { id: v.id }, select: { stock: true } });
    await tx.stockMovement.create({
      data: { variantId: v.id, delta, stockAfter: after.stock, reason: input.reason, note: input.note ?? null, actorId: input.actorId },
    });
    return { stock: after.stock, delta };
  });
}
