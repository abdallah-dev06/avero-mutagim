import { PageHeader } from "@/components/admin/admin-shell";
import { SizeChartEditor } from "@/components/admin/content-editors";
import { requireAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "دليل المقاسات" };

export default async function SizeChartsPage() {
  const user = await requireAdminPage();
  const charts = await prisma.sizeChart.findMany({ orderBy: [{ isDefault: "desc" }, { name: "asc" }], include: { rows: { orderBy: { sortOrder: "asc" } } } });
  const toStr = (n: number | null) => (n == null ? "" : String(n));
  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader title="جداول المقاسات" description="القيم الحالية أولية من جدول مرجعي — يرجى مراجعتها وتأكيدها قبل اعتمادها. يمكن ربط جدول بقسم أو بمنتج محدد." />
      {charts.map((c) => (
        <SizeChartEditor
          key={c.id}
          canDelete={user.role === "ADMIN"}
          chart={{
            id: c.id,
            name: c.name,
            description: c.description ?? "",
            measurementType: c.measurementType === "GARMENT" ? "GARMENT" : "BODY",
            isDefault: c.isDefault,
            rows: c.rows.map((r) => ({ label: r.label, euSize: r.euSize ?? "", bustCm: toStr(r.bustCm), waistCm: toStr(r.waistCm), hipsCm: toStr(r.hipsCm) })),
          }}
        />
      ))}
      <SizeChartEditor canDelete={false} chart={{ name: "جدول جديد", description: "", measurementType: "BODY", isDefault: false, rows: [{ label: "S", euSize: "", bustCm: "", waistCm: "", hipsCm: "" }] }} />
    </div>
  );
}
