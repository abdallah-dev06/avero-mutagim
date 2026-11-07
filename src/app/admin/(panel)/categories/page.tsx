import { PageHeader } from "@/components/admin/admin-shell";
import { CategoryList } from "@/components/admin/content-editors";
import { prisma } from "@/lib/db";

export const metadata = { title: "الأقسام والمجموعات" };

export default async function CategoriesAdminPage() {
  const [categories, collections, charts] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }),
    prisma.collection.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }),
    prisma.sizeChart.findMany({ select: { id: true, name: true } }),
  ]);
  return (
    <div className="space-y-5">
      <PageHeader title="الأقسام والمجموعات" description="أضيفي أي قسم جديد (مثل: فساتين، جاكيتات) دون تعديل الكود." />
      <CategoryList kind="category" sizeCharts={charts} items={categories.map((c) => ({ ...c, count: c._count.products }))} />
      <CategoryList kind="collection" sizeCharts={charts} items={collections.map((c) => ({ ...c, count: c._count.products }))} />
    </div>
  );
}
