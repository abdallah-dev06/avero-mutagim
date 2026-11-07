import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: { default: "لوحة الإدارة", template: "%s | إدارة VETRINA" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  const settings = await getSettings();
  const [orders, lowStock] = await Promise.all([
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.productVariant.count({ where: { isActive: true, stock: { lte: settings.inventory.defaultLowStockThreshold }, product: { status: "PUBLISHED" } } }),
  ]);
  return (
    <AdminShell user={{ name: user.name, role: user.role }} counts={{ orders, stock: lowStock }}>
      {children}
    </AdminShell>
  );
}
