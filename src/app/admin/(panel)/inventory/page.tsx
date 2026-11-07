import Link from "next/link";
import { Card, PageHeader } from "@/components/admin/admin-shell";
import { BulkStockEditor } from "@/components/admin/bulk-stock-editor";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "المخزون" };

const REASON_LABEL: Record<string, string> = { INITIAL: "رصيد أولي", ORDER: "طلب", CANCEL_RESTORE: "إلغاء طلب", RETURN_RESTORE: "مرتجع", MANUAL: "تعديل يدوي", CORRECTION: "تصحيح" };

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  const sp = await searchParams;
  const settings = await getSettings();
  const threshold = settings.inventory.defaultLowStockThreshold;
  const filter = sp.filter === "low" || sp.filter === "out" ? sp.filter : "all";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const where: Prisma.ProductVariantWhereInput = {
    product: { status: { not: "ARCHIVED" } },
    ...(filter === "low" ? { stock: { lte: threshold }, isActive: true } : filter === "out" ? { stock: 0, isActive: true } : {}),
    ...(q ? { OR: [{ sku: { contains: q, mode: "insensitive" } }, { product: { name: { contains: q, mode: "insensitive" } } }] } : {}),
  };
  const [variants, movements, counts] = await Promise.all([
    prisma.productVariant.findMany({
      where,
      orderBy: [{ product: { name: "asc" } }, { color: { sortOrder: "asc" } }, { size: "asc" }],
      take: 400,
      include: { product: { select: { id: true, name: true, status: true } }, color: { select: { name: true, hex: true } } },
    }),
    prisma.stockMovement.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { variant: { select: { sku: true, size: true, product: { select: { name: true } }, color: { select: { name: true } } } } } }),
    Promise.all([
      prisma.productVariant.count({ where: { product: { status: { not: "ARCHIVED" } } } }),
      prisma.productVariant.count({ where: { product: { status: { not: "ARCHIVED" } }, isActive: true, stock: { lte: threshold } } }),
      prisma.productVariant.count({ where: { product: { status: { not: "ARCHIVED" } }, isActive: true, stock: 0 } }),
    ]),
  ]);
  const actors = await prisma.user.findMany({ where: { id: { in: [...new Set(movements.map((m) => m.actorId).filter(Boolean) as string[])] } }, select: { id: true, name: true } });

  return (
    <div className="space-y-5">
      <PageHeader title="المخزون" description={`حد التنبيه: ${threshold} قطع أو أقل (من إعدادات الموقع)`} />
      <div className="flex flex-wrap items-center gap-2">
        {[
          { k: "all", l: `الكل (${counts[0]})` },
          { k: "low", l: `منخفض (${counts[1]})` },
          { k: "out", l: `نفد (${counts[2]})` },
        ].map((t) => (
          <Link key={t.k} href={`/admin/inventory?filter=${t.k}`} className={cn("rounded-full px-4 py-2 text-sm", filter === t.k ? "bg-burgundy text-ivory" : "bg-white ring-1 ring-line")}>
            {t.l}
          </Link>
        ))}
        <form action="/admin/inventory" className="ms-auto">
          <input type="hidden" name="filter" value={filter} />
          <input name="q" defaultValue={q} placeholder="بحث بالاسم أو SKU" aria-label="بحث" className="h-10 w-56 rounded-xl border border-line bg-white px-3 text-[16px] sm:text-sm" />
        </form>
      </div>

      <BulkStockEditor
        threshold={threshold}
        rows={variants.map((v) => ({
          id: v.id,
          productId: v.product.id,
          product: v.product.name,
          draft: v.product.status !== "PUBLISHED",
          color: v.color.name,
          hex: v.color.hex,
          size: v.size,
          sku: v.sku,
          stock: v.stock,
          isActive: v.isActive,
          low: v.lowStockThreshold ?? threshold,
        }))}
      />

      <Card title="آخر حركات المخزون">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-right text-xs text-muted">
              <tr>
                <th className="py-2 font-normal">الوقت</th>
                <th className="py-2 font-normal">المنتج</th>
                <th className="py-2 font-normal">التغيير</th>
                <th className="py-2 font-normal">بعد</th>
                <th className="py-2 font-normal">السبب</th>
                <th className="py-2 font-normal">بواسطة</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-t border-line/60">
                  <td className="py-2 text-xs">{formatDate(m.createdAt, true)}</td>
                  <td className="py-2">
                    {m.variant.product.name}
                    <span className="block text-xs text-muted">
                      {m.variant.color.name} / {m.variant.size} · <span className="latin">{m.variant.sku}</span>
                    </span>
                  </td>
                  <td className={cn("latin py-2 font-bold", m.delta > 0 ? "text-success" : "text-danger")}>{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                  <td className="latin py-2">{m.stockAfter}</td>
                  <td className="py-2 text-xs">
                    {REASON_LABEL[m.reason]}
                    {m.note && <span className="block text-muted">{m.note}</span>}
                  </td>
                  <td className="py-2 text-xs">{actors.find((a) => a.id === m.actorId)?.name ?? (m.reason === "ORDER" ? "الموقع" : "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
