import { PageHeader } from "@/components/admin/admin-shell";
import { DeliveryEditor } from "@/components/admin/content-editors";
import { prisma } from "@/lib/db";

export const metadata = { title: "مناطق التوصيل" };

export default async function DeliveryPage() {
  const cities = await prisma.city.findMany({ orderBy: { sortOrder: "asc" }, include: { areas: { orderBy: { sortOrder: "asc" } }, _count: { select: { orders: true } } } });
  return (
    <div className="max-w-4xl">
      <PageHeader title="مدن ومناطق التوصيل" description="تظهر المدن والمناطق المفعّلة فقط في صفحة إتمام الطلب. مدن قطاع غزة مضافة لكنها متوقفة افتراضياً حسب تغطية شركة التوصيل." />
      <DeliveryEditor cities={cities.map((c) => ({ id: c.id, name: c.name, isActive: c.isActive, orders: c._count.orders, areas: c.areas.map((a) => ({ id: a.id, name: a.name, isActive: a.isActive })) }))} />
    </div>
  );
}
