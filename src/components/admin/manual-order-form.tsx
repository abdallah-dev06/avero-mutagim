"use client";

import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { getAreas } from "@/app/(store)/actions";
import { createManualOrder, searchVariants } from "@/app/admin/actions/orders";
import { Card } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { formatILS } from "@/lib/money";

type VariantHit = Awaited<ReturnType<typeof searchVariants>>[number];

export function ManualOrderForm({ cities }: { cities: { id: string; name: string }[] }) {
  const router = useRouter();
  const [key] = React.useState(() => crypto.randomUUID());
  const [q, setQ] = React.useState("");
  const [hits, setHits] = React.useState<VariantHit[]>([]);
  const [lines, setLines] = React.useState<(VariantHit & { quantity: number })[]>([]);
  const [cityId, setCityId] = React.useState("");
  const [areas, setAreas] = React.useState<{ name: string }[]>([]);
  const [pending, start] = React.useTransition();
  const [searching, setSearching] = React.useState(false);


  React.useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) return setHits([]);
      setSearching(true);
      try {
        setHits(await searchVariants(q));
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const add = (v: VariantHit) => {
    if (v.stock <= 0) return toast.error("هذا المتغير نفد من المخزون");
    setLines((ls) => {
      const ex = ls.find((l) => l.id === v.id);
      if (ex) return ls.map((l) => (l.id === v.id ? { ...l, quantity: Math.min(l.stock, l.quantity + 1) } : l));
      return [...ls, { ...v, quantity: 1 }];
    });
  };
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createManualOrder({
        customerName: fd.get("customerName"),
        phone: fd.get("phone"),
        cityId,
        areaName: fd.get("areaName"),
        addressLine: fd.get("addressLine"),
        note: fd.get("note") || undefined,
        source: fd.get("source"),
        status: fd.get("status"),
        lines: lines.map((l) => ({ variantId: l.id, quantity: l.quantity })),
        idempotencyKey: key,
      });
      if (res.ok) {
        toast.success(`تم إنشاء الطلب ${res.reference}`);
        router.push(`/admin/orders/${res.orderId}`);
      } else toast.error(res.error);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card title="المنتجات">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي باسم المنتج أو SKU" style={{ paddingInlineStart: "2.25rem" }} aria-label="بحث عن منتج" />
        </div>
        {(hits.length > 0 || searching) && (
          <ul className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-line">
            {searching && <li className="p-3 text-sm text-muted">جارٍ البحث…</li>}
            {hits.map((h) => (
              <li key={h.id}>
                <button type="button" onClick={() => add(h)} disabled={h.stock <= 0} className="flex w-full items-center justify-between gap-2 border-b border-line/60 p-3 text-right text-sm hover:bg-blush disabled:opacity-50">
                  <span className="flex items-center gap-2">
                    <span className="size-4 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: h.hex }} />
                    <span>
                      {h.label} {h.draft && <span className="text-xs text-amber-700">(مسودة)</span>}
                      <span className="latin block text-xs text-muted">{h.sku}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-xs">
                    <span className="latin font-bold">{formatILS(h.unitPrice)}</span> · المخزون {h.stock}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {lines.length > 0 ? (
          <ul className="mt-4 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  {l.label}
                  <span className="latin block text-xs text-muted">
                    {l.sku} · {formatILS(l.unitPrice)}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Button type="button" size="iconSm" variant="ghost" aria-label="إنقاص" onClick={() => setLines((ls) => ls.map((x) => (x.id === l.id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x)))}>
                    <Minus />
                  </Button>
                  <span className="latin w-6 text-center">{l.quantity}</span>
                  <Button type="button" size="iconSm" variant="ghost" aria-label="زيادة" disabled={l.quantity >= l.stock} onClick={() => setLines((ls) => ls.map((x) => (x.id === l.id ? { ...x, quantity: Math.min(x.stock, x.quantity + 1) } : x)))}>
                    <Plus />
                  </Button>
                  <Button type="button" size="iconSm" variant="ghost" aria-label="حذف" onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}>
                    <Trash2 />
                  </Button>
                </span>
              </li>
            ))}
            <li className="flex justify-between pt-3 font-bold">
              <span>المجموع (تقديري — يُحسب نهائياً على الخادم)</span>
              <span className="latin">{formatILS(subtotal)}</span>
            </li>
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">لم تتم إضافة منتجات بعد.</p>
        )}
      </Card>

      <Card title="بيانات الزبونة">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="الاسم" htmlFor="customerName" required>
            <Input id="customerName" name="customerName" required />
          </Field>
          <Field label="الهاتف" htmlFor="phone" required>
            <Input id="phone" name="phone" type="tel" dir="ltr" className="text-right" required />
          </Field>
          <Field label="المدينة" htmlFor="cityId" required>
            <Select
              id="cityId"
              value={cityId}
              onChange={(e) => {
                setCityId(e.target.value);
                setAreas([]);
                if (e.target.value) getAreas(e.target.value).then(setAreas);
              }}
              required
            >
              <option value="">اختاري</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="المنطقة" htmlFor="areaName" required>
            <Select id="areaName" name="areaName" required disabled={!areas.length}>
              <option value="">اختاري</option>
              {areas.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="العنوان" htmlFor="addressLine" className="sm:col-span-2" required>
            <Input id="addressLine" name="addressLine" required />
          </Field>
          <Field label="ملاحظة" htmlFor="note" className="sm:col-span-2">
            <Textarea id="note" name="note" rows={2} />
          </Field>
          <Field label="مصدر الطلب" htmlFor="source">
            <Select id="source" name="source" defaultValue="WHATSAPP">
              <option value="WHATSAPP">واتساب</option>
              <option value="INSTAGRAM">إنستغرام</option>
              <option value="MANUAL">مباشر / آخر</option>
            </Select>
          </Field>
          <Field label="الحالة الابتدائية" htmlFor="status">
            <Select id="status" name="status" defaultValue="CONFIRMED">
              <option value="CONFIRMED">تم التأكيد</option>
              <option value="NEW">جديد</option>
            </Select>
          </Field>
        </div>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={pending} disabled={!lines.length}>
          إنشاء الطلب وخصم المخزون
        </Button>
      </div>
    </form>
  );
}
