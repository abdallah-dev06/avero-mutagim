import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatILS } from "@/lib/money";
import { displayPhone } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "./print-button";

export const metadata = { title: "قسيمة تجهيز", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PrintPage({ params }: PageProps<"/admin/print/[id]">) {
  await requireAdminPage();
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();
  const settings = await getSettings();
  return (
    <main className="mx-auto max-w-[720px] bg-white p-8 text-ink print:p-0">
      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>
      <header className="flex items-center justify-between border-b-2 border-burgundy pb-4">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo-round.png" alt="" width={56} height={56} className="rounded-full" />
          <div className="latin leading-none">
            <p className="font-display text-xl tracking-[0.2em] text-burgundy">VETRINA</p>
            <p className="mt-1 text-[10px] tracking-[0.4em] text-mauve">BOUTIQUE</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-xs text-muted">قسيمة تجهيز</p>
          <p className="latin text-xl font-bold tracking-wider">{order.reference}</p>
          <p className="text-xs">{formatDate(order.createdAt, true)}</p>
        </div>
      </header>
      <section className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted">إلى</p>
          <p className="text-base font-bold">{order.customerName}</p>
          <p className="latin text-right">{displayPhone(order.phone)}</p>
          <p>
            {order.cityName} — {order.areaName}
          </p>
          <p>{order.addressLine}</p>
        </div>
        <div>
          <p className="text-xs text-muted">الدفع</p>
          <p className="text-base font-bold">نقداً عند الاستلام</p>
          <p className="latin text-2xl font-bold">{formatILS(order.total)}</p>
          {order.courierName && <p className="mt-1">التوصيل: {order.courierName} {order.trackingCode ? `· ${order.trackingCode}` : ""}</p>}
        </div>
      </section>
      {order.note && <p className="mt-4 rounded-lg border border-line p-2 text-sm">ملاحظة الزبونة: {order.note}</p>}
      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink text-right">
            <th className="py-2">✓</th>
            <th className="py-2">القطعة</th>
            <th className="py-2">اللون / المقاس</th>
            <th className="py-2">SKU</th>
            <th className="py-2">الكمية</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id} className="border-b border-line">
              <td className="py-2">
                <span className="inline-block size-4 border border-ink" />
              </td>
              <td className="py-2">{i.productName}</td>
              <td className="py-2">
                {i.colorName} / {i.size}
              </td>
              <td className="latin py-2 text-xs">{i.sku}</td>
              <td className="latin py-2 text-center font-bold">{i.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-center text-xs text-muted">
        {settings.business.name} · {settings.shipping.message} · {settings.business.whatsappNumber && <span className="latin">{displayPhone(settings.business.whatsappNumber)}</span>}
      </p>
    </main>
  );
}
