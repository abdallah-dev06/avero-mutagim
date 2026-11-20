"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Truck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { getAreas, placeOrder } from "@/app/(store)/actions";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { formatILS } from "@/lib/money";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { CartLine } from "@/server/cart";

export function CheckoutForm({
  cities,
  lines,
  subtotal,
  shippingFee,
  inside48Fee = 3000,
  shippingMessage,
  inside48Message = "توصيل مناطق الداخل بـ 30 ₪ (نصف السعر)",
  defaults,
}: {
  cities: { id: string; name: string }[];
  lines: CartLine[];
  subtotal: number;
  shippingFee: number;
  inside48Fee?: number;
  shippingMessage: string;
  inside48Message?: string;
  defaults?: { customerName?: string; phone?: string };
}) {
  const router = useRouter();
  const [idempotencyKey] = React.useState(() => crypto.randomUUID());
  const [areas, setAreas] = React.useState<{ name: string }[]>([]);
  const [loadingAreas, setLoadingAreas] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  // Synchronous double-click guard (the server is also idempotent via idempotencyKey).
  const busy = React.useRef(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
    defaultValues: { customerName: defaults?.customerName ?? "", phone: defaults?.phone ?? "", cityId: "", areaName: "", addressLine: "", note: "", whatsappOptIn: false, idempotencyKey },
  });

  const cityId = useWatch({ control, name: "cityId" });
  const selectedCity = cities.find((c) => c.id === cityId);
  const isInside48 = Boolean(selectedCity?.name?.includes("الداخل"));
  const currentShippingFee = isInside48 ? inside48Fee : shippingFee;
  const loadAreas = (id: string) => {
    setValue("areaName", "");
    setAreas([]);
    if (!id) return;
    setLoadingAreas(true);
    getAreas(id)
      .then(setAreas)
      .catch(() => toast.error("تعذّر تحميل المناطق، حاولي مجدداً"))
      .finally(() => setLoadingAreas(false));
  };

  const onSubmit = async (data: CheckoutInput): Promise<boolean> => {
    setServerError(null);
    try {
      const res = await placeOrder({ ...data, idempotencyKey });
      if (res.ok) {
        router.replace(res.redirectTo);
        return true; // keep the button disabled while navigating
      }
      if (res.fieldErrors) {
        for (const [k, msg] of Object.entries(res.fieldErrors)) setError(k as keyof CheckoutInput, { message: msg });
      }
      setServerError(res.error);
      router.refresh();
    } catch {
      setServerError("تعذّر الاتصال. تحققي من الإنترنت ثم أعيدي المحاولة — لن يتكرر طلبك.");
    }
    return false;
  };

  const err = (k: keyof CheckoutInput) => (errors[k]?.message as string | undefined) ?? undefined;
  const aria = (k: keyof CheckoutInput) => ({ "aria-invalid": !!errors[k] || undefined, "aria-describedby": errors[k] ? `${k}-error` : undefined });

  return (
    <form
      onSubmit={(e) => {
        if (busy.current) return e.preventDefault();
        busy.current = true;
        void handleSubmit(
          async (d) => {
            if (!(await onSubmit(d))) busy.current = false;
          },
          () => {
            busy.current = false;
          },
        )(e);
      }}
      noValidate className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12">
      <div className="space-y-8">
        <section className="rounded-[24px] border border-line bg-white p-5 sm:p-7">
          <h2 className="mb-5 flex items-center gap-3 text-lg font-medium text-burgundy">
            <span className="latin grid size-8 place-items-center rounded-full bg-burgundy text-sm text-ivory">1</span>
            بيانات التواصل
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الاسم الكامل" htmlFor="customerName" error={err("customerName")} required>
              <Input id="customerName" autoComplete="name" {...register("customerName")} {...aria("customerName")} />
            </Field>
            <Field label="رقم الهاتف (واتساب)" htmlFor="phone" error={err("phone")} hint={<>مثال: <span className="latin inline-block">0599 123 456</span></>} required>
              <Input id="phone" type="tel" inputMode="tel" dir="ltr" className="text-right" autoComplete="tel" {...register("phone")} {...aria("phone")} />
            </Field>
          </div>
        </section>

        <section className="rounded-[24px] border border-line bg-white p-5 sm:p-7">
          <h2 className="mb-5 flex items-center gap-3 text-lg font-medium text-burgundy">
            <span className="latin grid size-8 place-items-center rounded-full bg-burgundy text-sm text-ivory">2</span>
            عنوان التوصيل
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="المدينة" htmlFor="cityId" error={err("cityId")} required>
              <Select id="cityId" {...register("cityId", { onChange: (e) => loadAreas(e.target.value) })} {...aria("cityId")}>
                <option value="">اختر المدينة</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="المنطقة" htmlFor="areaName" error={err("areaName")} required>
              <Select id="areaName" disabled={!cityId || loadingAreas} {...register("areaName")} {...aria("areaName")}>
                <option value="">{loadingAreas ? "جارٍ التحميل…" : cityId ? "اختر المنطقة" : "اختر المدينة أولاً"}</option>
                {areas.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="العنوان بالتفصيل" htmlFor="addressLine" error={err("addressLine")} hint="الحي، الشارع، أقرب معلم، رقم البناية" className="sm:col-span-2" required>
              <Input id="addressLine" autoComplete="street-address" {...register("addressLine")} {...aria("addressLine")} />
            </Field>
            <Field label="ملاحظات (اختياري)" htmlFor="note" error={err("note")} className="sm:col-span-2">
              <Textarea id="note" rows={3} placeholder="وقت مناسب للتوصيل، تفاصيل إضافية…" {...register("note")} />
            </Field>
          </div>
        </section>

        <section className="rounded-[24px] border border-line bg-white p-5 sm:p-7">
          <h2 className="mb-5 flex items-center gap-3 text-lg font-medium text-burgundy">
            <span className="latin grid size-8 place-items-center rounded-full bg-burgundy text-sm text-ivory">3</span>
            طريقة الدفع
          </h2>
          <label className="flex items-center gap-3 rounded-2xl border-2 border-burgundy bg-blush/50 p-4">
            <input type="radio" checked readOnly className="size-5 accent-burgundy" name="payment" />
            <span>
              <span className="block font-medium text-burgundy">الدفع عند الاستلام</span>
              <span className="text-sm text-muted">ادفعي نقداً لمندوب التوصيل عند استلام طلبك.</span>
            </span>
          </label>
          <Checkbox className="mt-5" label="أوافق على استلام تحديثات حالة الطلب عبر واتساب" {...register("whatsappOptIn")} />
        </section>
      </div>

      <aside className="h-fit rounded-[24px] border border-line bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6 lg:sticky lg:top-24" aria-label="ملخص الطلب">
        <h2 className="text-lg font-medium text-burgundy">طلبك ({lines.reduce((s, l) => s + l.quantity, 0)})</h2>
        <ul className="mt-4 max-h-80 space-y-4 overflow-y-auto pe-1">
          {lines.map((l) => (
            <li key={l.id} className="flex gap-3">
              <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-xl bg-blush">
                {l.image && <Image src={l.image} alt="" fill sizes="64px" className="object-cover" />}
                <span className="latin absolute -top-0 left-0 grid min-w-5 place-items-center rounded-br-lg bg-burgundy px-1 text-[11px] text-ivory">{l.quantity}</span>
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="line-clamp-2">{l.name}</p>
                <p className="text-xs text-muted">
                  {l.colorName} · <span className="latin">{l.size === "ONE SIZE" ? "مقاس واحد" : l.size}</span>
                </p>
                {l.issue && <p className="text-xs text-danger">{l.issue}</p>}
              </div>
              <p className="latin text-sm font-medium">{formatILS(l.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">المجموع الفرعي</dt>
            <dd className="latin">{formatILS(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">التوصيل</dt>
            <dd className={cn("font-medium", currentShippingFee === 0 ? "text-success" : "text-burgundy")}>
              {currentShippingFee === 0 ? (
                "مجاني — 0 ₪"
              ) : (
                <span className="latin flex items-center gap-1.5">
                  {formatILS(currentShippingFee)}
                  {isInside48 && <span className="text-xs text-muted font-normal">(الداخل المحتل)</span>}
                </span>
              )}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt className="font-medium">الإجمالي (عند الاستلام)</dt>
            <dd className="latin text-lg font-bold text-burgundy">{formatILS(subtotal + currentShippingFee)}</dd>
          </div>
        </dl>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted">
          <Truck className="size-4 shrink-0 text-gold" /> {isInside48 ? inside48Message : shippingMessage}
        </p>
        {serverError && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-danger">
            {serverError}
          </p>
        )}
        <Button type="submit" size="lg" className="mt-5 w-full" loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? "جارٍ تأكيد الطلب…" : "تأكيد الطلب"}
        </Button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
          <Lock className="size-3.5" /> بياناتك محمية ولا نشاركها مع أي جهة
        </p>
      </aside>
    </form>
  );
}
