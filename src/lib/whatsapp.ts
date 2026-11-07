import type { OrderStatus } from "@/generated/prisma/enums";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { formatILS } from "@/lib/money";
import { waDigits } from "@/lib/phone";

export const TEMPLATE_PLACEHOLDERS = [
  { key: "{name}", label: "اسم الزبونة" },
  { key: "{reference}", label: "رقم الطلب" },
  { key: "{status}", label: "حالة الطلب" },
  { key: "{total}", label: "المجموع" },
  { key: "{items}", label: "قائمة القطع" },
  { key: "{tracking_link}", label: "رابط التتبع" },
  { key: "{store}", label: "اسم المتجر" },
] as const;

export const DEFAULT_WHATSAPP_TEMPLATES: Record<OrderStatus, string> = {
  NEW: "مرحباً {name} 🌸\nشكراً لطلبك من {store}.\nرقم الطلب: {reference}\nالمجموع: {total} (توصيل مجاني)\n\nالقطع:\n{items}\n\nسنتواصل معك قريباً لتأكيد الطلب.",
  CONFIRMED: "مرحباً {name} 🤍\nتم تأكيد طلبك رقم {reference} بنجاح.\nالمجموع: {total} — الدفع عند الاستلام.\nيمكنك متابعة طلبك من هنا:\n{tracking_link}",
  PROCESSING: "مرحباً {name}،\nطلبك رقم {reference} قيد التجهيز الآن ✨\nنحرص على تغليف قطعك بعناية.\n{tracking_link}",
  READY: "مرحباً {name}،\nطلبك رقم {reference} جاهز وسيُسلَّم لشركة التوصيل قريباً 📦\n{tracking_link}",
  OUT_FOR_DELIVERY: "مرحباً {name} 🚚\nطلبك رقم {reference} في الطريق إليك.\nيرجى تجهيز مبلغ {total} عند الاستلام.\n{tracking_link}",
  DELIVERED: "مرحباً {name} 💐\nتم تسليم طلبك رقم {reference}. نتمنى أن تنال القطع إعجابك!\nيسعدنا رأيك وصورك بالقطع على إنستغرام.\nشكراً لاختيارك {store}.",
  CANCELLED: "مرحباً {name}،\nنود إعلامك بأنه تم إلغاء الطلب رقم {reference}.\nلأي استفسار نحن بخدمتك هنا.",
  RETURNED: "مرحباً {name}،\nتم تسجيل إرجاع الطلب رقم {reference}.\nسنتواصل معك لترتيب أي تفاصيل متبقية.",
};

export type TemplateContext = {
  name: string;
  reference: string;
  status: OrderStatus;
  total: number;
  items: { productName: string; colorName: string; size: string; quantity: number }[];
  trackingLink?: string | null;
  store: string;
};

export function renderTemplate(body: string, ctx: TemplateContext) {
  const items = ctx.items.map((i) => `• ${i.productName} — ${i.colorName} / ${i.size} × ${i.quantity}`).join("\n");
  const map: Record<string, string> = {
    "{name}": ctx.name.split(" ")[0] ?? ctx.name,
    "{reference}": ctx.reference,
    "{status}": ORDER_STATUS_LABEL[ctx.status],
    "{total}": `${formatILS(ctx.total).replace(" ₪", "")} شيكل`,
    "{items}": items,
    "{tracking_link}": ctx.trackingLink ?? "",
    "{store}": ctx.store,
  };
  return body
    .replace(/\{(name|reference|status|total|items|tracking_link|store)\}/g, (m) => map[m] ?? m)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Opens a WhatsApp draft. This does NOT send anything — the merchant sends it manually. */
export function waMeLink(e164Phone: string, text?: string) {
  const base = `https://wa.me/${waDigits(e164Phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
