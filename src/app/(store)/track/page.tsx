import type { Metadata } from "next";
import { TrackForm } from "./track-form";

export const metadata: Metadata = { title: "تتبّع الطلب", alternates: { canonical: "/track" } };

export default async function TrackPage({ searchParams }: PageProps<"/track">) {
  const sp = await searchParams;
  return (
    <div className="container-lux max-w-lg py-12 md:py-20">
      <div className="text-center">
        <p className="latin font-display text-xs uppercase tracking-[0.35em] text-mauve">Track your order</p>
        <h1 className="mt-2 text-3xl font-medium text-burgundy md:text-4xl">تتبّع طلبك</h1>
        <p className="mt-3 leading-relaxed text-muted">أدخل رقم الطلب ورقم الهاتف المستخدم عند الطلب.</p>
      </div>
      <TrackForm initialRef={typeof sp.ref === "string" ? sp.ref : ""} />
    </div>
  );
}
