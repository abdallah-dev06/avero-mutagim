import type { OrderSource, OrderStatus, PrismaClient } from "@/generated/prisma/client";
import { effectivePrice } from "@/lib/money";
import { orderReference, randomToken } from "@/lib/crypto";
import { canTransition, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { DomainError, StockError, isUniqueViolation } from "@/server/errors";

type Db = PrismaClient;
type Tx = Parameters<Parameters<Db["$transaction"]>[0]>[0];

export const MAX_QTY_PER_LINE = 20;
export const MAX_LINES = 40;

export type OrderLineInput = { variantId: string; quantity: number };
export type CustomerInput = {
  customerName: string;
  phone: string; // already normalised E.164
  cityId: string;
  areaName: string;
  addressLine: string;
  note?: string | null;
};

export type CreateOrderInput = {
  lines: OrderLineInput[];
  customer: CustomerInput;
  shippingFee: number; // agorot — from server settings, never from the browser
  idempotencyKey?: string | null;
  source?: OrderSource;
  customerId?: string | null;
  actor?: { id: string; name: string } | null;
  allowUnpublished?: boolean; // staff manual orders may include drafts
  initialStatus?: OrderStatus;
};

export type CreateOrderResult = {
  orderId: string;
  reference: string;
  accessToken: string | null; // null when an idempotent retry returned an existing order
  duplicate: boolean;
};

function mergeLines(lines: OrderLineInput[]) {
  const map = new Map<string, number>();
  for (const l of lines) {
    if (!l.variantId || !Number.isInteger(l.quantity) || l.quantity < 1) throw new DomainError("كمية غير صالحة");
    map.set(l.variantId, (map.get(l.variantId) ?? 0) + l.quantity);
  }
  if (map.size === 0) throw new DomainError("السلة فارغة");
  if (map.size > MAX_LINES) throw new DomainError("عدد المنتجات في الطلب كبير جداً");
  for (const q of map.values()) if (q > MAX_QTY_PER_LINE) throw new DomainError(`الحد الأقصى ${MAX_QTY_PER_LINE} قطعة لكل منتج`);
  // Deterministic lock order prevents deadlocks between concurrent checkouts.
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([variantId, quantity]) => ({ variantId, quantity }));
}

async function findByKey(db: Db, key: string) {
  const existing = await db.order.findUnique({ where: { idempotencyKey: key }, select: { id: true, reference: true } });
  return existing ? { orderId: existing.id, reference: existing.reference, accessToken: null, duplicate: true } : null;
}

/**
 * Creates an order atomically: validates variants, computes authoritative prices,
 * decrements stock with a conditional update (no overselling), records stock
 * movements and the order timeline. Idempotent on `idempotencyKey`.
 */
export async function createOrder(db: Db, input: CreateOrderInput): Promise<CreateOrderResult> {
  if (input.idempotencyKey) {
    const dup = await findByKey(db, input.idempotencyKey);
    if (dup) return dup;
  }
  const lines = mergeLines(input.lines);
  const city = await db.city.findFirst({ where: { id: input.customer.cityId, isActive: true } });
  if (!city) throw new DomainError("يرجى اختيار مدينة صحيحة");

  const accessToken = randomToken(24);
  try {
    return await db.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: { id: { in: lines.map((l) => l.variantId) } },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              salePrice: true,
              status: true,
              images: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], select: { url: true, colorId: true } },
            },
          },
          color: { select: { name: true } },
        },
      });
      const byId = new Map(variants.map((v) => [v.id, v]));
      let subtotal = 0;
      let itemCount = 0;
      const items: {
        variantId: string;
        productId: string;
        productName: string;
        colorName: string;
        size: string;
        sku: string;
        imageUrl: string | null;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
        stockAfter: number;
      }[] = [];

      for (const line of lines) {
        const v = byId.get(line.variantId);
        const sellable =
          v && v.isActive && (v.product.status === "PUBLISHED" || (input.allowUnpublished && v.product.status !== "ARCHIVED"));
        if (!v || !sellable) throw new StockError("أحد المنتجات لم يعد متوفراً", line.variantId);

        const dec = await tx.productVariant.updateMany({
          where: { id: v.id, isActive: true, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (dec.count !== 1) {
          throw new StockError(`الكمية المطلوبة من «${v.product.name}» (${v.color.name} / ${v.size}) غير متوفرة حالياً`, v.id);
        }
        const after = await tx.productVariant.findUniqueOrThrow({ where: { id: v.id }, select: { stock: true } });
        const unitPrice = Math.max(0, effectivePrice(v.product) + v.priceAdjustment);
        const lineTotal = unitPrice * line.quantity;
        subtotal += lineTotal;
        itemCount += line.quantity;
        const image = v.product.images.find((i) => i.colorId === v.colorId) ?? v.product.images[0];
        items.push({
          variantId: v.id,
          productId: v.product.id,
          productName: v.product.name,
          colorName: v.color.name,
          size: v.size,
          sku: v.sku,
          imageUrl: image?.url ?? null,
          unitPrice,
          quantity: line.quantity,
          lineTotal,
          stockAfter: after.stock,
        });
      }

      const shippingFee = Math.max(0, input.shippingFee);
      const status = input.initialStatus ?? "NEW";
      const order = await tx.order.create({
        data: {
          reference: orderReference(),
          accessToken,
          idempotencyKey: input.idempotencyKey ?? null,
          source: input.source ?? "WEBSITE",
          customerId: input.customerId ?? null,
          customerName: input.customer.customerName,
          phone: input.customer.phone,
          cityId: city.id,
          cityName: city.name,
          areaName: input.customer.areaName,
          addressLine: input.customer.addressLine,
          note: input.customer.note || null,
          subtotal,
          shippingFee,
          total: subtotal + shippingFee,
          itemCount,
          status,
          confirmedAt: status === "NEW" ? null : new Date(),
          createdById: input.actor?.id ?? null,
          items: { create: items.map(({ stockAfter: _s, ...i }) => i) },
          events: {
            create: {
              type: "CREATED",
              toStatus: status,
              message: input.actor ? `طلب يدوي أنشأه ${input.actor.name}` : "طلب جديد من الموقع",
              actorId: input.actor?.id ?? null,
              actorName: input.actor?.name ?? null,
            },
          },
        },
      });

      await tx.stockMovement.createMany({
        data: items.map((i) => ({
          variantId: i.variantId,
          delta: -i.quantity,
          stockAfter: i.stockAfter,
          reason: "ORDER" as const,
          orderId: order.id,
          actorId: input.actor?.id ?? null,
          note: order.reference,
        })),
      });
      for (const i of items) {
        await tx.product.update({ where: { id: i.productId }, data: { soldCount: { increment: i.quantity } } });
      }
      return { orderId: order.id, reference: order.reference, accessToken, duplicate: false };
    });
  } catch (e) {
    // Two identical submissions raced: the loser returns the winner's order.
    if (input.idempotencyKey && isUniqueViolation(e, "idempotencyKey")) {
      const dup = await findByKey(db, input.idempotencyKey);
      if (dup) return dup;
    }
    throw e;
  }
}

/** Puts order quantities back exactly once (guarded by `stockRestoredAt`). */
export async function restoreOrderStock(
  tx: Tx,
  orderId: string,
  reason: "CANCEL_RESTORE" | "RETURN_RESTORE",
  actorId: string | null,
) {
  const claimed = await tx.order.updateMany({ where: { id: orderId, stockRestoredAt: null }, data: { stockRestoredAt: new Date() } });
  if (claimed.count !== 1) return false;
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, select: { reference: true } });
  const items = await tx.orderItem.findMany({ where: { orderId }, orderBy: { variantId: "asc" } });
  for (const item of items) {
    if (!item.variantId) continue;
    const exists = await tx.productVariant.findUnique({ where: { id: item.variantId }, select: { id: true } });
    if (!exists) continue;
    const v = await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
      select: { stock: true },
    });
    await tx.stockMovement.create({
      data: { variantId: item.variantId, delta: item.quantity, stockAfter: v.stock, reason, orderId, actorId, note: order.reference },
    });
    if (item.productId) {
      await tx.product.updateMany({
        where: { id: item.productId, soldCount: { gte: item.quantity } },
        data: { soldCount: { decrement: item.quantity } },
      });
    }
  }
  await tx.orderEvent.create({ data: { orderId, type: "STOCK_RESTORED", message: "أُعيدت الكميات إلى المخزون", actorId } });
  return true;
}

export async function changeOrderStatus(
  db: Db,
  input: { orderId: string; to: OrderStatus; actor: { id: string; name: string }; note?: string | null; restock?: boolean },
) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new DomainError("الطلب غير موجود");
    if (!canTransition(order.status, input.to)) {
      throw new DomainError(`لا يمكن نقل الطلب من «${ORDER_STATUS_LABEL[order.status]}» إلى «${ORDER_STATUS_LABEL[input.to]}»`);
    }
    const now = new Date();
    // Optimistic concurrency: only succeeds if nobody changed the status meanwhile.
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: {
        status: input.to,
        ...(input.to === "CONFIRMED" && !order.confirmedAt ? { confirmedAt: now } : {}),
        ...(input.to === "DELIVERED" ? { deliveredAt: now } : {}),
        ...(input.to === "CANCELLED" ? { cancelledAt: now } : {}),
      },
    });
    if (updated.count !== 1) throw new DomainError("تم تعديل الطلب من جهة أخرى، يرجى التحديث والمحاولة مجدداً");

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "STATUS_CHANGE",
        fromStatus: order.status,
        toStatus: input.to,
        message: input.note || null,
        actorId: input.actor.id,
        actorName: input.actor.name,
      },
    });

    let restored = false;
    if (input.to === "CANCELLED") restored = await restoreOrderStock(tx, order.id, "CANCEL_RESTORE", input.actor.id);
    if (input.to === "RETURNED" && input.restock) restored = await restoreOrderStock(tx, order.id, "RETURN_RESTORE", input.actor.id);
    return { from: order.status, to: input.to, restored };
  });
}
