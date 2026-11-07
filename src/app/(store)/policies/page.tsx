import type { Metadata } from "next";
import { formatILS } from "@/lib/money";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "التوصيل والاستبدال", alternates: { canonical: "/policies" } };

export default async function PoliciesPage() {
  const s = await getSettings();
  return (
    <div className="container-lux max-w-3xl py-10 md:py-14">
      <h1 className="text-center text-3xl font-medium text-burgundy md:text-5xl">التوصيل والاستبدال</h1>
      <div className="mt-10 space-y-6">
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="text-xl font-medium text-burgundy">التوصيل</h2>
          <p className="mt-3 leading-[1.9]">
            {s.shipping.message}. رسوم التوصيل: <span className="latin inline-block">{formatILS(s.shipping.fee)}</span>.
          </p>
          <p className="mt-2 leading-[1.9] text-muted">{s.shipping.estimate}.</p>
        </section>
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="text-xl font-medium text-burgundy">الدفع</h2>
          <p className="mt-3 leading-[1.9]">الدفع نقداً عند الاستلام. لا نطلب أي بيانات بنكية عبر الموقع.</p>
        </section>
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="text-xl font-medium text-burgundy">الاستبدال والإرجاع</h2>
          <p className="mt-3 whitespace-pre-line leading-[1.9]">{s.shipping.returnsPolicy}</p>
        </section>
      </div>
    </div>
  );
}
