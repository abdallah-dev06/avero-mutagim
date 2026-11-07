import { timingSafeEqual } from "node:crypto";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderSuccessMark, OrderTimeline } from "@/components/store/order-status-view";
import { WhatsAppIcon } from "@/components/store/social-icons";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatILS } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { displayPhone } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { cn, formatDate } from "@/lib/utils";
import { waMeLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "تفاصيل الطلب", robots: { index: false, follow: false } };

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export default async function OrderPage({ params, searchParams }: PageProps<"/order/[reference]">) {
  const [{ reference }, sp] = await Promise.all([params, searchParams]);
  const token = typeof sp.t === "string" ? sp.t : "";
  const order = await prisma.order.findUnique({
    where: { reference: decodeURIComponent(reference).toUpperCase() },
    include: { items: true, events: { where: { type: { in: ["CREATED", "STATUS_CHANGE"] } }, orderBy: { createdAt: "asc" } } },
  });
  // Same 404 for "not found" and "wrong token" — avoids revealing which references exist.
  if (!order || !token || !safeEqual(order.accessToken, token)) notFound();
  const settings = await getSettings();
  const isNew = sp.new === "1";
  const helpText = `مرحباً، أستفسر عن طلبي رقم ${order.reference}`;

  return (
    <div className="container-lux max-w-4xl py-8 md:py-14">
      <header className="text-center">
        {isNew ? (
          <>
            <OrderSuccessMark />
            <h1 className="mt-6 text-3xl font-medium text-burgundy md:text-4xl">شكراً لك، تم استلام طلبك!</h1>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">سنتواصل معك قريباً عبر الهاتف أو واتساب لتأكيد الطلب. احتفظي برابط هذه الصفحة لمتابعة حالة طلبك.</p>
          </>
        ) : (
          <h1 className="text-3xl font-medium text-burgundy md:text-4xl">متابعة الطلب</h1>
        )}
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-blush px-5 py-2.5 text-burgundy">
          رقم الطلب: <strong className="latin tracking-wider">{order.reference}</strong>
        </p>
      </header>

      <section className="mt-10 rounded-[24px] border border-line bg-white p-5 sm:p-8" aria-labelledby="status-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="status-title" className="text-lg font-medium text-burgundy">
            حالة الطلب
          </h2>
          <span className={cn("rounded-full px-3 py-1 text-sm font-medium", order.status === "CANCELLED" || order.status === "RETURNED" ? "bg-stone-100 text-stone-700" : "bg-blush text-burgundy")}>
            {ORDER_STATUS_LABEL[order.status]}
          </span>
        </div>
        <OrderTimeline status={order.status} events={order.events.map((e) => ({ status: e.toStatus, at: e.createdAt.toISOString() }))} />
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
        <section className="rounded-[24px] border border-line bg-white p-5 sm:p-7">
          <h2 className="text-lg font-medium text-burgundy">القطع ({order.itemCount})</h2>
          <ul className="mt-4 divide-y divide-line">
            {order.items.map((i) => (
              <li key={i.id} className="flex gap-3 py-3">
                <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-xl bg-blush">{i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="64px" className="object-cover" />}</div>
                <div className="min-w-0 flex-1 text-sm">
                  <p>{i.productName}</p>
                  <p className="text-xs text-muted">
                    {i.colorName} · <span className="latin">{i.size === "ONE SIZE" ? "مقاس واحد" : i.size}</span> · الكمية {i.quantity}
                  </p>
                </div>
                <p className="latin text-sm font-medium">{formatILS(i.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">المجموع الفرعي</dt>
              <dd className="latin">{formatILS(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">التوصيل</dt>
              <dd className="text-success">{order.shippingFee === 0 ? "مجاني" : <span className="latin">{formatILS(order.shippingFee)}</span>}</dd>
            </div>
            <div className="flex justify-between text-base font-medium">
              <dt>الإجمالي — الدفع عند الاستلام</dt>
              <dd className="latin font-bold text-burgundy">{formatILS(order.total)}</dd>
            </div>
          </dl>
        </section>
        <aside className="space-y-6">
          <section className="rounded-[24px] border border-line bg-white p-5 text-sm leading-relaxed">
            <h2 className="mb-2 font-medium text-burgundy">التوصيل إلى</h2>
            <p>{order.customerName}</p>
            <p className="latin text-right">{displayPhone(order.phone)}</p>
            <p>
              {order.cityName} — {order.areaName}
            </p>
            <p className="text-muted">{order.addressLine}</p>
            <p className="mt-2 text-xs text-muted">تاريخ الطلب: {formatDate(order.createdAt, true)}</p>
          </section>
          {settings.business.whatsappNumber && (
            <a href={waMeLink(settings.business.whatsappNumber, helpText)} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "whatsapp" }), "w-full")}>
              <WhatsAppIcon /> تواصلي معنا بخصوص الطلب
            </a>
          )}
          <Link href="/shop" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
            متابعة التسوق
          </Link>
        </aside>
      </div>
    </div>
  );
}
