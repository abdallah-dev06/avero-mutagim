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
          <p className="mt-3 leading-[1.9] font-medium text-ink">
            {s.shipping.message}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-ivory/60 p-3.5">
              <span className="block text-xs font-bold text-burgundy">الضفة الغربية والقدس</span>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                {s.shipping.fee === 0 ? "توصيل مجاني (0 ₪)" : formatILS(s.shipping.fee)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-ivory/60 p-3.5">
              <span className="block text-xs font-bold text-burgundy">مناطق الداخل المحتل (48)</span>
              <p className="mt-1 text-sm font-semibold text-burgundy">
                {formatILS(s.shipping.inside48Fee ?? 3000)} (بنصف السعر)
              </p>
            </div>
          </div>
          <p className="mt-3 leading-[1.9] text-sm text-muted">{s.shipping.estimate}.</p>
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
