import { PageHeader } from "@/components/admin/admin-shell";
import { ManualOrderForm } from "@/components/admin/manual-order-form";
import { prisma } from "@/lib/db";

export const metadata = { title: "طلب يدوي" };

export default async function NewOrderPage() {
  const cities = await prisma.city.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <div className="max-w-4xl">
      <PageHeader title="طلب يدوي" description="لطلبات واتساب وإنستغرام والطلبات المباشرة — بنفس قواعد المخزون والأسعار." />
      <ManualOrderForm cities={cities} />
    </div>
  );
}
