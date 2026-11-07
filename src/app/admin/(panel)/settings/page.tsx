import { PageHeader } from "@/components/admin/admin-shell";
import { SettingsForm, TestimonialsManager } from "@/components/admin/settings-form";
import { requireAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "إعدادات الموقع" };

export default async function SettingsPage() {
  const user = await requireAdminPage();
  const [settings, testimonials] = await Promise.all([getSettings(), prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } })]);
  return (
    <div className="max-w-5xl">
      <PageHeader title="إعدادات الموقع" description="كل التغييرات تُحفظ في قاعدة البيانات وتظهر في المتجر فوراً." />
      <TestimonialsManager items={testimonials} />
      <div className="mt-5">
        <SettingsForm initial={settings} canEdit={user.role === "ADMIN"} />
      </div>
    </div>
  );
}
