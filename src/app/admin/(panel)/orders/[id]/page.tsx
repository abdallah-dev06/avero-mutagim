import { ArrowRight, Printer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/admin/admin-shell";
import { OrderActions } from "@/components/admin/order-actions";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatILS } from "@/lib/money";
import { allowedTransitions, ORDER_SOURCE_LABEL, ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_STATUS_LABEL } from "@/lib/order-status";
import { displayPhone } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, cn, formatDate } from "@/lib/utils";
import { DEFAULT_WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import { whatsappCloudConfigured } from "@/server/whatsapp-cloud";

export const metadata = { title: "تفاصيل الطلب" };

const EVENT_LABEL: Record<string, string> = {
  CREATED: "إنشاء الطلب",
  STATUS_CHANGE: "تغيير الحالة",
  PAYMENT_CHANGE: "الدفع",
  NOTE: "ملاحظة داخلية",
  WHATSAPP_DRAFT_OPENED: "مسودة واتساب",
  STOCK_RESTORED: "المخزون",
  FULFILLMENT_UPDATE: "التوصيل",
};

export default async function OrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, events: { orderBy: { createdAt: "desc" } }, messages: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();
  const [templates, settings] = await Promise.all([prisma.whatsAppTemplate.findMany(), getSettings()]);
  const tplMap = { ...DEFAULT_WHATSAPP_TEMPLATES, ...Object.fromEntries(templates.map((t) => [t.status, t.body])) };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-burgundy">
            <ArrowRight className="size-4" /> الطلبات
          </Link>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-medium text-burgundy">
            <span className="latin tracking-wider">{order.reference}</span>
            <span className={cn("rounded-full px-3 py-1 text-sm ring-1", ORDER_STATUS_TONE[order.status])}>{ORDER_STATUS_LABEL[order.status]}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {formatDate(order.createdAt, true)} · المصدر: {ORDER_SOURCE_LABEL[order.source]} · الدفع: {PAYMENT_STATUS_LABEL[order.paymentStatus]} (عند الاستلام)
          </p>
        </div>
        <Link href={`/admin/print/${order.id}`} target="_blank" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          <Printer /> قسيمة التجهيز
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          <OrderActions
            order={{
              id: order.id,
              reference: order.reference,
              status: order.status,
              paymentStatus: order.paymentStatus,
              courierName: order.courierName,
              trackingCode: order.trackingCode,
              phone: order.phone,
              customerName: order.customerName,
              total: order.total,
              whatsappOptIn: order.whatsappOptIn,
              stockRestored: !!order.stockRestoredAt,
              items: order.items.map((i) => ({ productName: i.productName, colorName: i.colorName, size: i.size, quantity: i.quantity })),
            }}
            transitions={allowedTransitions(order.status)}
            templates={tplMap}
            trackingLink={absoluteUrl(`/order/${order.reference}?t=${encodeURIComponent(order.accessToken)}`)}
            storeName={settings.business.name}
            cloudEnabled={whatsappCloudConfigured()}
          />

          <Card title={`القطع (${order.itemCount})`}>
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex gap-3 py-3">
                  <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg bg-blush">{i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="56px" className="object-cover" />}</div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">{i.productName}</p>
                    <p className="text-xs text-muted">
                      {i.colorName} · {i.size} · <span className="latin">{i.sku}</span>
                    </p>
                  </div>
                  <div className="text-left text-sm">
                    <p className="latin font-bold">{formatILS(i.lineTotal)}</p>
                    <p className="latin text-xs text-muted">
                      {formatILS(i.unitPrice)} × {i.quantity}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">المجموع الفرعي</dt>
                <dd className="latin">{formatILS(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">التوصيل</dt>
                <dd className="latin">{formatILS(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between text-base font-bold">
                <dt>الإجمالي</dt>
                <dd className="latin text-burgundy">{formatILS(order.total)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="الزبونة والتوصيل">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted">الاسم</dt>
                <dd className="font-medium">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">الهاتف</dt>
                <dd>
                  <a href={`tel:${order.phone}`} className="latin text-burgundy hover:underline">
                    {displayPhone(order.phone)}
                  </a>
                  <span className="latin block text-xs text-muted">{order.phone}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">العنوان</dt>
                <dd>
                  {order.cityName} — {order.areaName}
                  <br />
                  {order.addressLine}
                </dd>
              </div>
              {order.note && (
                <div>
                  <dt className="text-xs text-muted">ملاحظة الزبونة</dt>
                  <dd className="whitespace-pre-line rounded-lg bg-blush/60 p-2">{order.note}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted">موافقة على رسائل واتساب التلقائية</dt>
                <dd>{order.whatsappOptIn ? "نعم" : "لا"}</dd>
              </div>
            </dl>
          </Card>

          {order.messages.length > 0 && (
            <Card title="رسائل WhatsApp Cloud API">
              <ul className="space-y-2 text-sm">
                {order.messages.map((m) => (
                  <li key={m.id} className="flex justify-between gap-2">
                    <span>
                      {m.template} <span className="block text-xs text-muted">{formatDate(m.createdAt, true)}</span>
                    </span>
                    <span className={cn("h-fit rounded-full px-2 py-0.5 text-xs", m.status === "FAILED" ? "bg-rose-50 text-danger" : "bg-emerald-50 text-emerald-900")} title={m.error ?? undefined}>
                      {m.status}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">الحالة تُحدَّث فقط من إشعارات Meta الموقّعة.</p>
            </Card>
          )}

          <Card title="سجل الطلب">
            <ol className="relative space-y-4 border-r border-line pr-4">
              {order.events.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className={cn("absolute -right-[21px] top-1.5 size-2.5 rounded-full ring-4 ring-white", e.type === "NOTE" ? "bg-gold" : e.type === "WHATSAPP_DRAFT_OPENED" ? "bg-[#1f7a4d]" : "bg-burgundy")} />
                  <p className="font-medium">
                    {EVENT_LABEL[e.type]}
                    {e.type === "STATUS_CHANGE" && e.toStatus && (
                      <span className="font-normal">
                        : {e.fromStatus ? ORDER_STATUS_LABEL[e.fromStatus] : ""} ← {ORDER_STATUS_LABEL[e.toStatus]}
                      </span>
                    )}
                    {e.type === "WHATSAPP_DRAFT_OPENED" && e.toStatus && <span className="font-normal"> ({ORDER_STATUS_LABEL[e.toStatus]})</span>}
                  </p>
                  {e.message && <p className="mt-0.5 whitespace-pre-line text-muted">{e.message}</p>}
                  <p className="mt-0.5 text-xs text-muted">
                    {e.actorName ?? "النظام"} · {formatDate(e.createdAt, true)}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
