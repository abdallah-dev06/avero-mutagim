import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { SizeGuidePageClient } from "./client";

export const metadata: Metadata = {
  title: "دليل المقاسات",
  description: "جدول المقاسات بالسنتيمتر وأداة لاقتراح المقاس المناسب لك.",
  alternates: { canonical: "/size-guide" },
};

export default async function SizeGuidePage() {
  const charts = await prisma.sizeChart.findMany({ orderBy: [{ isDefault: "desc" }, { name: "asc" }], include: { rows: { orderBy: { sortOrder: "asc" } } } });
  return (
    <div className="container-lux max-w-4xl py-10 md:py-14">
      <header className="mb-10 text-center">
        <p className="latin font-display text-xs uppercase tracking-[0.35em] text-mauve">Size Guide</p>
        <h1 className="mt-2 text-3xl font-medium text-burgundy md:text-5xl">دليل المقاسات</h1>
        <p className="mx-auto mt-3 max-w-xl leading-relaxed text-muted">جميع القياسات بالسنتيمتر. استخدمي شريط قياس مرن وقيسي فوق ملابس خفيفة.</p>
      </header>
      {charts.length ? (
        <SizeGuidePageClient charts={charts.map((c) => ({ id: c.id, name: c.name, description: c.description, measurementType: c.measurementType, rows: c.rows }))} />
      ) : (
        <p className="text-center text-muted">لم يُضف جدول مقاسات بعد.</p>
      )}
      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        {[
          { t: "الصدر", d: "مرّري الشريط حول أعرض جزء من الصدر، أفقياً تحت الإبطين." },
          { t: "الخصر", d: "قيسي حول أضيق جزء من الخصر، عادةً فوق السرّة بقليل." },
          { t: "الأرداف", d: "قيسي حول أعرض جزء من الأرداف مع ضم القدمين." },
        ].map((x, i) => (
          <div key={x.t} className="rounded-2xl border border-line bg-white p-5">
            <span className="latin font-display text-3xl text-dusty">0{i + 1}</span>
            <h2 className="mt-2 font-medium text-burgundy">{x.t}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{x.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
