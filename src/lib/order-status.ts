import type { OrderStatus, PaymentStatus, OrderSource } from "@/generated/prisma/enums";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "جديد",
  CONFIRMED: "تم التأكيد",
  PROCESSING: "قيد التجهيز",
  READY: "جاهز للتوصيل",
  OUT_FOR_DELIVERY: "قيد التوصيل",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
  RETURNED: "مرتجع",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  NEW: "bg-blush text-burgundy ring-dusty",
  CONFIRMED: "bg-sky-50 text-sky-900 ring-sky-200",
  PROCESSING: "bg-amber-50 text-amber-900 ring-amber-200",
  READY: "bg-violet-50 text-violet-900 ring-violet-200",
  OUT_FOR_DELIVERY: "bg-indigo-50 text-indigo-900 ring-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  CANCELLED: "bg-stone-100 text-stone-700 ring-stone-300",
  RETURNED: "bg-rose-50 text-rose-900 ring-rose-200",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "غير مدفوع",
  PAID: "مدفوع",
  REFUNDED: "مسترد",
};

export const ORDER_SOURCE_LABEL: Record<OrderSource, string> = {
  WEBSITE: "الموقع",
  MANUAL: "يدوي",
  WHATSAPP: "واتساب",
  INSTAGRAM: "إنستغرام",
};

export const ALL_STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[];
export const FULFILLMENT_FLOW: OrderStatus[] = ["NEW", "CONFIRMED", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];
const TERMINAL: OrderStatus[] = ["CANCELLED", "RETURNED"];

/** Allowed next statuses. Forward moves along the flow may skip steps (useful for offline orders). */
export function allowedTransitions(from: OrderStatus): OrderStatus[] {
  if (TERMINAL.includes(from)) return [];
  const i = FULFILLMENT_FLOW.indexOf(from);
  const next: OrderStatus[] = FULFILLMENT_FLOW.slice(i + 1);
  if (from !== "DELIVERED") next.push("CANCELLED");
  if (from === "OUT_FOR_DELIVERY" || from === "DELIVERED") next.push("RETURNED");
  return next;
}

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return allowedTransitions(from).includes(to);
}

/** Customer-facing progress index (0..5) or -1 for terminal states. */
export function progressIndex(status: OrderStatus) {
  return FULFILLMENT_FLOW.indexOf(status);
}
