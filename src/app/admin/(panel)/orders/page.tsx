import { Download, Plus, Search } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/admin-shell";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatILS } from "@/lib/money";
import { ALL_STATUSES, ORDER_SOURCE_LABEL, ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_STATUS_LABEL } from "@/lib/order-status";
import { displayPhone } from "@/lib/phone";
import { cn, formatDate } from "@/lib/utils";
import { orderFilters, orderWhere } from "@/server/admin-orders";

export const metadata = { title: "الطلبات" };
const PAGE = 30;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const f = orderFilters(sp);
  const where = orderWhere(f);
  const [orders, total, cities] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE, skip: (f.page - 1) * PAGE }),
    prisma.order.count({ where }),
    prisma.order.findMany({ distinct: ["cityName"], select: { cityName: true }, orderBy: { cityName: "asc" } }),
  ]);
  const qs = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => typeof v === "string" && k !== "page" && qs.set(k, v));
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div>
      <PageHeader
        title="الطلبات"
        description={`${total} طلب`}
        actions={
          <>
            <Link href={`/admin/orders/export?${qs.toString()}`} className={buttonVariants({ variant: "secondary", size: "sm" })} prefetch={false}>
              <Download /> تصدير CSV
            </Link>
            <Link href="/admin/orders/new" className={buttonVariants({ size: "sm" })}>
              <Plus /> طلب يدوي
            </Link>
          </>
        }
      />

      <form className="mb-4 grid gap-2 rounded-2xl border border-line bg-white p-3 sm:grid-cols-2 lg:grid-cols-7" action="/admin/orders">
        <label className="relative lg:col-span-2">
          <span className="sr-only">بحث</span>
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={f.q} placeholder="رقم الطلب، الاسم، الهاتف…" className="h-11 w-full rounded-xl border border-line pe-3 ps-9 text-[16px] sm:text-sm" style={{ paddingInlineStart: "2.25rem" }} />
        </label>
        <select name="status" defaultValue={f.status ?? ""} className="h-11 rounded-xl border border-line bg-white px-3 text-sm" aria-label="حالة الطلب">
          <option value="">كل الحالات</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select name="payment" defaultValue={f.payment ?? ""} className="h-11 rounded-xl border border-line bg-white px-3 text-sm" aria-label="حالة الدفع">
          <option value="">كل حالات الدفع</option>
          {Object.entries(PAYMENT_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="city" defaultValue={f.city ?? ""} className="h-11 rounded-xl border border-line bg-white px-3 text-sm" aria-label="المدينة">
          <option value="">كل المدن</option>
          {cities.map((c) => (
            <option key={c.cityName} value={c.cityName}>
              {c.cityName}
            </option>
          ))}
        </select>
        <input type="date" name="from" defaultValue={f.from} aria-label="من تاريخ" className="h-11 rounded-xl border border-line bg-white px-2 text-sm" />
        <div className="flex gap-2">
          <input type="date" name="to" defaultValue={f.to} aria-label="إلى تاريخ" className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-2 text-sm" />
          <button type="submit" className="h-11 shrink-0 rounded-xl bg-burgundy px-4 text-sm text-ivory">
            تصفية
          </button>
        </div>
      </form>

      {orders.length ? (
        <>
          {/* mobile cards */}
          <ul className="space-y-2 md:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="block rounded-2xl border border-line bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="latin font-bold">{o.reference}</span>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs ring-1", ORDER_STATUS_TONE[o.status])}>{ORDER_STATUS_LABEL[o.status]}</span>
                  </div>
                  <p className="mt-1 text-sm">
                    {o.customerName} · <span className="latin">{displayPhone(o.phone)}</span>
                  </p>
                  <div className="mt-1 flex justify-between text-xs text-muted">
                    <span>
                      {o.cityName} · {formatDate(o.createdAt, true)}
                    </span>
                    <span className="latin font-bold text-burgundy">{formatILS(o.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {/* desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-line bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-blush/60 text-right text-xs text-burgundy">
                <tr>
                  {["الطلب", "الزبونة", "المدينة", "التاريخ", "المصدر", "الدفع", "الحالة", "المجموع"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-line/70 hover:bg-ivory">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="latin font-bold text-burgundy hover:underline">
                        {o.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {o.customerName}
                      <span className="latin block text-xs text-muted">{displayPhone(o.phone)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {o.cityName}
                      <span className="block text-xs text-muted">{o.areaName}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{formatDate(o.createdAt, true)}</td>
                    <td className="px-4 py-3 text-xs">{ORDER_SOURCE_LABEL[o.source]}</td>
                    <td className="px-4 py-3 text-xs">{PAYMENT_STATUS_LABEL[o.paymentStatus]}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs ring-1", ORDER_STATUS_TONE[o.status])}>{ORDER_STATUS_LABEL[o.status]}</span>
                    </td>
                    <td className="latin px-4 py-3 font-bold">{formatILS(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav className="mt-4 flex flex-wrap justify-center gap-2" aria-label="الصفحات">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
                const q = new URLSearchParams(qs);
                q.set("page", String(p));
                return (
                  <Link key={p} href={`/admin/orders?${q}`} aria-current={p === f.page ? "page" : undefined} className={cn("grid size-10 place-items-center rounded-full text-sm", p === f.page ? "bg-burgundy text-ivory" : "bg-white ring-1 ring-line")}>
                    {p}
                  </Link>
                );
              })}
            </nav>
          )}
        </>
      ) : (
        <p className="rounded-2xl border border-line bg-white p-10 text-center text-muted">لا توجد طلبات مطابقة.</p>
      )}
    </div>
  );
}
