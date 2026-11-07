import { PageHeader } from "@/components/admin/admin-shell";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "سجل النشاط" };

export default async function ActivityPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { actor: { select: { name: true, email: true } } } });
  return (
    <div>
      <PageHeader title="سجل النشاط" description="آخر 200 عملية حساسة (تسجيل دخول، تعديلات، مخزون، إعدادات)." />
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-blush/60 text-right text-xs text-burgundy">
            <tr>
              <th className="px-4 py-3">الوقت</th>
              <th className="px-4 py-3">المستخدم</th>
              <th className="px-4 py-3">العملية</th>
              <th className="px-4 py-3">العنصر</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-line/70">
                <td className="px-4 py-2.5 text-xs">{formatDate(l.createdAt, true)}</td>
                <td className="px-4 py-2.5">{l.actor?.name ?? "—"}</td>
                <td className="latin px-4 py-2.5 text-xs">{l.action}</td>
                <td className="latin px-4 py-2.5 text-xs">
                  {l.entity} {l.entityId ? `· ${l.entityId.slice(0, 24)}` : ""}
                </td>
                <td className="latin px-4 py-2.5 text-xs text-muted">{l.ip ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
