import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { BarChart } from "@/components/admin/bar-chart";
import { Card, PageHeader } from "@/components/admin/admin-shell";
import { prisma } from "@/lib/db";
import { formatILS } from "@/lib/money";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, ALL_STATUSES } from "@/lib/order-status";
import { getSettings } from "@/lib/settings";
import { cn, formatDate } from "@/lib/utils";
import { getDashboard, localDateDaysAgo, localDateString } from "@/server/dashboard";

const PRESETS = [
  { key: "today", label: "اليوم", days: 0 },
  { key: "7", label: "7 أيام", days: 6 },
  { key: "30", label: "30 يوماً", days: 29 },
  { key: "90", label: "90 يوماً", days: 89 },
];
const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const today = localDateString(new Date());
  const preset = PRESETS.find((p) => p.key === sp.range) ?? (isDate(sp.from) ? null : PRESETS[2]);
  const to = preset ? today : isDate(sp.to) ? sp.to : today;
  const from = preset ? localDateDaysAgo(preset.days) : (sp.from as string);
  const settings = await getSettings();
  const d = await getDashboard(from <= to ? from : to, to, settings.revenue.recognizeOn);
  const lowStock = await prisma.productVariant.findMany({
    where: { isActive: true, stock: { lte: settings.inventory.defaultLowStockThreshold }, product: { status: "PUBLISHED" } },
    orderBy: { stock: "asc" },
    take: 8,
    include: { product: { select: { name: true, id: true } }, color: { select: { name: true } } },
  });
  const lowStockCount = await prisma.productVariant.count({ where: { isActive: true, stock: { lte: settings.inventory.defaultLowStockThreshold }, product: { status: "PUBLISHED" } } });
  const shortDay = (s: string) => `${Number(s.slice(8))}/${Number(s.slice(5, 7))}`;

  return (
    <div className="space-y-6">
      <PageHeader title="لوحة التحكم" description={`الفترة: ${from} → ${to} (توقيت فلسطين)`} />

      <form className="flex flex-wrap items-center gap-2" action="/admin">
        {PRESETS.map((p) => (
          <Link key={p.key} href={`/admin?range=${p.key}`} className={cn("rounded-full px-4 py-2 text-sm transition", preset?.key === p.key ? "bg-burgundy text-ivory" : "bg-white text-ink ring-1 ring-line hover:ring-mauve")}>
            {p.label}
          </Link>
        ))}
        <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
        <label className="flex items-center gap-1 text-sm">
          من <input type="date" name="from" defaultValue={from} max={today} className="h-10 rounded-xl border border-line bg-white px-2 text-sm" />
        </label>
        <label className="flex items-center gap-1 text-sm">
          إلى <input type="date" name="to" defaultValue={to} max={today} className="h-10 rounded-xl border border-line bg-white px-2 text-sm" />
        </label>
        <button type="submit" className="h-10 rounded-full bg-blush px-4 text-sm text-burgundy">
          تطبيق
        </button>
      </form>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="طلبات اليوم" value={String(d.todayCount)} href="/admin/orders?range=today" />
        <Stat label="إجمالي الطلبات (الفترة)" value={String(d.allCount)} hint={`منها ${d.status.CANCELLED?.count ?? 0} ملغي`} />
        <Stat label="القيمة الإجمالية للطلبات" value={formatILS(d.grossValue)} hint="كل الطلبات عدا الملغاة" />
        <Stat
          label={settings.revenue.recognizeOn === "PAID" ? "الإيراد المحصّل" : "إيراد الطلبات المسلّمة"}
          value={formatILS(d.realisedValue)}
          hint={`${d.realisedCount} طلب · ${settings.revenue.recognizeOn === "PAID" ? "حالة الدفع: مدفوع" : "حالة: تم التسليم"}`}
          strong
        />
        <Stat label="تم التسليم" value={String(d.status.DELIVERED?.count ?? 0)} />
        <Stat label="ملغي / مرتجع" value={`${d.status.CANCELLED?.count ?? 0} / ${d.status.RETURNED?.count ?? 0}`} hint={d.returnedValue ? `قيمة المرتجع ${formatILS(d.returnedValue)}` : undefined} />
        <Stat label="متوسط قيمة الطلب" value={formatILS(d.aov)} />
        <Stat label="المنتجات المنشورة" value={`${d.productsPublished} / ${d.productsTotal}`} href="/admin/products" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="عدد الطلبات يومياً">
          <BarChart title="عدد الطلبات يومياً" data={d.days.map((x) => ({ key: x.day, label: shortDay(x.day), value: x.orders, display: `${x.orders} طلب` }))} />
        </Card>
        <Card title="القيمة الإجمالية يومياً (عدا الملغاة)">
          <BarChart title="القيمة الإجمالية يومياً" data={d.days.map((x) => ({ key: x.day, label: shortDay(x.day), value: x.gross, display: formatILS(x.gross) }))} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="الطلبات حسب الحالة">
          <ul className="space-y-2">
            {ALL_STATUSES.map((s) => (
              <li key={s} className="flex items-center justify-between text-sm">
                <Link href={`/admin/orders?status=${s}`} className={cn("rounded-full px-2.5 py-1 text-xs ring-1", ORDER_STATUS_TONE[s])}>
                  {ORDER_STATUS_LABEL[s]}
                </Link>
                <span className="latin font-medium">{d.status[s]?.count ?? 0}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="الأكثر طلباً (حسب المتغير)">
          {d.topVariants.length ? (
            <ol className="space-y-2.5 text-sm">
              {d.topVariants.map((v, i) => (
                <li key={v.sku} className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="latin text-muted">{i + 1}. </span>
                    {v.productName}
                    <span className="block text-xs text-muted">
                      {v.colorName} · {v.size} · <span className="latin">{v.sku}</span>
                    </span>
                  </span>
                  <span className="latin shrink-0 font-medium">×{v._sum.quantity}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted">لا توجد طلبات في هذه الفترة.</p>
          )}
        </Card>
        <Card title={`مخزون منخفض (${lowStockCount})`} actions={<Link href="/admin/inventory?filter=low" className="text-sm text-burgundy hover:underline">الكل</Link>}>
          {lowStock.length ? (
            <ul className="space-y-2 text-sm">
              {lowStock.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2">
                  <Link href={`/admin/products/${v.product.id}`} className="min-w-0 truncate hover:text-burgundy">
                    {v.product.name} <span className="text-xs text-muted">— {v.color.name} / {v.size}</span>
                  </Link>
                  <span className={cn("latin shrink-0 rounded-full px-2 py-0.5 text-xs font-bold", v.stock === 0 ? "bg-rose-50 text-danger" : "bg-amber-50 text-amber-900")}>{v.stock}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">لا توجد منتجات منخفضة المخزون.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="أحدث الطلبات" actions={<Link href="/admin/orders" className="text-sm text-burgundy hover:underline">كل الطلبات</Link>}>
          {d.recentOrders.length ? (
            <ul className="divide-y divide-line">
              {d.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-burgundy">
                    <span className="min-w-0">
                      <span className="latin font-medium">{o.reference}</span>
                      <span className="block truncate text-xs text-muted">
                        {o.customerName} · {o.cityName} · {formatDate(o.createdAt, true)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="latin">{formatILS(o.total)}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] ring-1", ORDER_STATUS_TONE[o.status])}>{ORDER_STATUS_LABEL[o.status]}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">لا توجد طلبات بعد.</p>
          )}
        </Card>
        <Card title="آخر النشاطات">
          <ul className="space-y-2.5 text-sm">
            {d.recentEvents.map((e) => (
              <li key={e.id} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-mauve" />
                <span className="min-w-0">
                  <Link href={`/admin/orders/${e.order.id}`} className="latin font-medium hover:underline">
                    {e.order.reference}
                  </Link>{" "}
                  {e.type === "STATUS_CHANGE" && e.toStatus ? `← ${ORDER_STATUS_LABEL[e.toStatus]}` : e.type === "CREATED" ? "طلب جديد" : e.type === "WHATSAPP_DRAFT_OPENED" ? "فُتحت مسودة واتساب" : e.message}
                  <span className="block text-xs text-muted">
                    {e.actorName ?? "النظام"} · {formatDate(e.createdAt, true)}
                  </span>
                </span>
              </li>
            ))}
            {d.recentAudit.map((a) => (
              <li key={a.id} className="flex items-start gap-2 text-muted">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span className="min-w-0 text-xs">
                  {a.action} · {a.entity} · {a.actor?.name ?? "—"} · {formatDate(a.createdAt, true)}
                </span>
              </li>
            ))}
            {!d.recentEvents.length && !d.recentAudit.length && <li className="text-muted">لا يوجد نشاط بعد.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, href, strong }: { label: string; value: string; hint?: string; href?: string; strong?: boolean }) {
  const body = (
    <div className={cn("h-full rounded-2xl border p-4 transition", strong ? "border-burgundy bg-burgundy text-ivory" : "border-line bg-white hover:border-dusty")}>
      <p className={cn("text-xs", strong ? "text-ivory/80" : "text-muted")}>{label}</p>
      <p className="latin mt-2 text-xl font-bold sm:text-2xl">{value}</p>
      {hint && <p className={cn("mt-1 text-[11px]", strong ? "text-ivory/70" : "text-muted")}>{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
