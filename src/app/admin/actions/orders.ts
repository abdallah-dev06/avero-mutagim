"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { OrderStatus } from "@/generated/prisma/enums";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ALL_STATUSES } from "@/lib/order-status";
import { normalizePhone } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/utils";
import { DEFAULT_WHATSAPP_TEMPLATES, renderTemplate, waMeLink } from "@/lib/whatsapp";
import { DomainError, publicMessage } from "@/server/errors";
import { changeOrderStatus, createOrder } from "@/server/orders";
import { sendWhatsAppTemplate, whatsappCloudConfigured } from "@/server/whatsapp-cloud";

type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function refresh(id?: string) {
  revalidatePath("/admin", "layout");
  if (id) revalidatePath(`/admin/orders/${id}`);
}

export async function updateOrderStatus(input: { orderId: string; to: string; note?: string; restock?: boolean }): Promise<R<{ restored: boolean }>> {
  try {
    const user = await requireStaff();
    if (!ALL_STATUSES.includes(input.to as OrderStatus)) throw new DomainError("حالة غير صالحة");
    const res = await changeOrderStatus(prisma, {
      orderId: String(input.orderId),
      to: input.to as OrderStatus,
      actor: { id: user.id, name: user.name },
      note: input.note?.slice(0, 500) || null,
      restock: !!input.restock,
    });
    await audit({ actorId: user.id, action: "order.status", entity: "Order", entityId: input.orderId, data: { from: res.from, to: res.to, restored: res.restored } });
    refresh(input.orderId);
    return { ok: true, restored: res.restored };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

export async function updatePaymentStatus(orderId: string, status: "UNPAID" | "PAID" | "REFUNDED"): Promise<R> {
  try {
    const user = await requireStaff();
    if (!["UNPAID", "PAID", "REFUNDED"].includes(status)) throw new DomainError("حالة دفع غير صالحة");
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { paymentStatus: true } });
    if (!order) throw new DomainError("الطلب غير موجود");
    if (order.paymentStatus === status) return { ok: true };
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { paymentStatus: status } }),
      prisma.orderEvent.create({ data: { orderId, type: "PAYMENT_CHANGE", message: `حالة الدفع: ${order.paymentStatus} ← ${status}`, actorId: user.id, actorName: user.name } }),
    ]);
    await audit({ actorId: user.id, action: "order.payment", entity: "Order", entityId: orderId, data: { from: order.paymentStatus, to: status } });
    refresh(orderId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

export async function addOrderNote(orderId: string, note: string): Promise<R> {
  try {
    const user = await requireStaff();
    const text = String(note).trim().slice(0, 1000);
    if (!text) throw new DomainError("الملاحظة فارغة");
    await prisma.orderEvent.create({ data: { orderId, type: "NOTE", message: text, isInternal: true, actorId: user.id, actorName: user.name } });
    refresh(orderId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

export async function updateFulfillment(orderId: string, data: { courierName?: string; trackingCode?: string }): Promise<R> {
  try {
    const user = await requireStaff();
    const courierName = String(data.courierName ?? "").trim().slice(0, 80) || null;
    const trackingCode = String(data.trackingCode ?? "").trim().slice(0, 80) || null;
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { courierName, trackingCode } }),
      prisma.orderEvent.create({ data: { orderId, type: "FULFILLMENT_UPDATE", message: `شركة التوصيل: ${courierName ?? "—"} · رقم الشحنة: ${trackingCode ?? "—"}`, actorId: user.id, actorName: user.name } }),
    ]);
    refresh(orderId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

async function buildMessage(orderId: string, status?: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new DomainError("الطلب غير موجود");
  const s = status ?? order.status;
  const [tpl, settings] = await Promise.all([prisma.whatsAppTemplate.findUnique({ where: { status: s } }), getSettings()]);
  const text = renderTemplate(tpl?.body ?? DEFAULT_WHATSAPP_TEMPLATES[s], {
    name: order.customerName,
    reference: order.reference,
    status: s,
    total: order.total,
    items: order.items,
    trackingLink: absoluteUrl(`/order/${order.reference}?t=${encodeURIComponent(order.accessToken)}`),
    store: settings.business.name,
  });
  return { order, text, status: s };
}

/** Prepares a wa.me draft. Records that a DRAFT was opened — never that a message was sent. */
export async function openWhatsAppDraft(orderId: string, status?: OrderStatus): Promise<R<{ url: string; text: string }>> {
  try {
    const user = await requireStaff();
    const { order, text, status: s } = await buildMessage(orderId, status);
    await prisma.orderEvent.create({
      data: { orderId, type: "WHATSAPP_DRAFT_OPENED", toStatus: s, message: "فُتحت مسودة واتساب (الإرسال يتم يدوياً من تطبيق واتساب)", actorId: user.id, actorName: user.name },
    });
    refresh(orderId);
    return { ok: true, url: waMeLink(order.phone, text), text };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

export async function previewWhatsApp(orderId: string, status: OrderStatus): Promise<R<{ text: string }>> {
  try {
    await requireStaff();
    const { text } = await buildMessage(orderId, status);
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

/** Official WhatsApp Business Cloud API — only when configured AND the customer opted in. */
export async function sendWhatsAppCloud(orderId: string): Promise<R<{ messageId: string }>> {
  try {
    const user = await requireStaff();
    if (!whatsappCloudConfigured()) throw new DomainError("واجهة WhatsApp Cloud API غير مُعدّة");
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new DomainError("الطلب غير موجود");
    if (!order.whatsappOptIn) throw new DomainError("الزبونة لم توافق على استلام رسائل تلقائية");
    const res = await sendWhatsAppTemplate({ orderId, to: order.phone, status: order.status, reference: order.reference, name: order.customerName });
    await audit({ actorId: user.id, action: "whatsapp.cloud.send", entity: "Order", entityId: orderId, data: { messageId: res.messageId } });
    refresh(orderId);
    return { ok: true, messageId: res.messageId };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

const manualSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(9).max(20),
  cityId: z.string().min(1),
  areaName: z.string().trim().min(1).max(80),
  addressLine: z.string().trim().min(2).max(240),
  note: z.string().trim().max(500).optional(),
  source: z.enum(["MANUAL", "WHATSAPP", "INSTAGRAM"]),
  status: z.enum(["NEW", "CONFIRMED"]),
  lines: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(40),
  idempotencyKey: z.string().uuid(),
});

export async function createManualOrder(raw: unknown): Promise<R<{ orderId: string; reference: string }>> {
  try {
    const user = await requireStaff();
    const parsed = manualSchema.safeParse(raw);
    if (!parsed.success) throw new DomainError("يرجى تعبئة جميع الحقول المطلوبة وإضافة منتج واحد على الأقل");
    const d = parsed.data;
    const phone = normalizePhone(d.phone);
    if (!phone) throw new DomainError("رقم الهاتف غير صحيح");
    const settings = await getSettings();
    const res = await createOrder(prisma, {
      lines: d.lines,
      customer: { customerName: d.customerName, phone, cityId: d.cityId, areaName: d.areaName, addressLine: d.addressLine, note: d.note || null },
      shippingFee: settings.shipping.fee,
      idempotencyKey: d.idempotencyKey,
      source: d.source,
      actor: { id: user.id, name: user.name },
      allowUnpublished: true,
      initialStatus: d.status,
    });
    if (!res.duplicate) await audit({ actorId: user.id, action: "order.manual.create", entity: "Order", entityId: res.orderId, data: { reference: res.reference } });
    refresh();
    return { ok: true, orderId: res.orderId, reference: res.reference };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

export async function searchVariants(q: string) {
  await requireStaff();
  const term = String(q).trim().slice(0, 60);
  if (term.length < 1) return [];
  const variants = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      product: { status: { not: "ARCHIVED" } },
      OR: [{ sku: { contains: term, mode: "insensitive" } }, { product: { name: { contains: term, mode: "insensitive" } } }],
    },
    take: 30,
    orderBy: [{ product: { name: "asc" } }],
    include: { product: { select: { name: true, price: true, salePrice: true, status: true } }, color: { select: { name: true, hex: true } } },
  });
  return variants.map((v) => ({
    id: v.id,
    label: `${v.product.name} — ${v.color.name} / ${v.size}`,
    sku: v.sku,
    hex: v.color.hex,
    stock: v.stock,
    unitPrice: (v.product.salePrice != null && v.product.salePrice < v.product.price ? v.product.salePrice : v.product.price) + v.priceAdjustment,
    draft: v.product.status !== "PUBLISHED",
  }));
}
