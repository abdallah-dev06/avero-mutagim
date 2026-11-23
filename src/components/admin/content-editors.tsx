"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { deleteSizeChart, saveArea, saveCategory, saveCity, saveSizeChart } from "@/app/admin/actions/content";
import { Card } from "@/components/admin/admin-shell";
import { ImageDropzone } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import { Dialog, DialogContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function useRun() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(msg);
        after?.();
        router.refresh();
      } else toast.error(r.error);
    });
  return { pending, run };
}

/* ───────── Categories & collections ───────── */
export type CatItem = { id?: string; name: string; nameEn: string | null; slug: string; description: string | null; imageUrl: string | null; isActive: boolean; isFeatured?: boolean; sortOrder: number; sizeChartId?: string | null; count?: number };

export function CategoryList({ kind, items, sizeCharts }: { kind: "category" | "collection"; items: CatItem[]; sizeCharts: { id: string; name: string }[] }) {
  const [edit, setEdit] = React.useState<CatItem | null>(null);
  const { pending, run } = useRun();
  const blank: CatItem = { name: "", nameEn: "", slug: "", description: "", imageUrl: null, isActive: true, isFeatured: true, sortOrder: items.length, sizeChartId: null };
  return (
    <Card
      title={kind === "category" ? "الأقسام" : "المجموعات"}
      actions={
        <Button size="sm" variant="soft" onClick={() => setEdit(blank)}>
          <Plus /> إضافة
        </Button>
      }
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((c) => (
          <li key={c.id} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-blush">{c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="56px" className="object-cover" />}</div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{c.name}</p>
              <p className="latin truncate text-xs text-muted">
                /{kind === "category" ? "category" : "collections"}/{c.slug}
                {c.count != null && ` · ${c.count}`}
              </p>
              {!c.isActive && <span className="text-xs text-danger">مخفي</span>}
            </div>
            <Button variant="ghost" size="iconSm" onClick={() => setEdit(c)} aria-label={`تعديل ${c.name}`}>
              <Pencil />
            </Button>
          </li>
        ))}
      </ul>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent title={edit?.id ? "تعديل" : "إضافة"}>
          {edit && (
            <form
              className="grid gap-3 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () =>
                    saveCategory({
                      id: edit.id,
                      kind,
                      name: edit.name,
                      nameEn: edit.nameEn ?? "",
                      slug: edit.slug,
                      description: edit.description ?? "",
                      imageUrl: edit.imageUrl ?? "",
                      isActive: edit.isActive,
                      isFeatured: edit.isFeatured,
                      sortOrder: edit.sortOrder,
                      sizeChartId: edit.sizeChartId ?? "",
                    }),
                  "تم الحفظ",
                  () => setEdit(null),
                );
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="الاسم" htmlFor="cn" required>
                  <Input id="cn" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} required />
                </Field>
                <Field label="الاسم بالإنجليزية (اختياري)" htmlFor="ce">
                  <Input id="ce" dir="ltr" value={edit.nameEn ?? ""} onChange={(e) => setEdit({ ...edit, nameEn: e.target.value })} />
                </Field>
                <Field label="الرابط (slug)" htmlFor="cs" hint="يُنشأ تلقائياً إن تُرك فارغاً">
                  <Input id="cs" dir="ltr" value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} />
                </Field>
                <Field label="الترتيب" htmlFor="co">
                  <Input id="co" type="number" min={0} value={edit.sortOrder} onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) || 0 })} />
                </Field>
              </div>
              <Field label="الوصف" htmlFor="cd">
                <Textarea id="cd" rows={2} value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
              </Field>
              <div className="flex items-start gap-3">
                {edit.imageUrl ? (
                  <div className="relative">
                    <div className="relative aspect-[3/4] w-24 overflow-hidden rounded-xl bg-blush">
                      <Image src={edit.imageUrl} alt="" fill sizes="96px" className="object-cover" />
                    </div>
                    <button type="button" className="mt-1 text-xs text-danger" onClick={() => setEdit({ ...edit, imageUrl: null })}>
                      إزالة
                    </button>
                  </div>
                ) : (
                  <div className="w-28">
                    <ImageDropzone compact multiple={false} folder={kind === "category" ? "categories" : "collections"} onUploaded={(img) => setEdit((x) => (x ? { ...x, imageUrl: img.url } : x))} label="صورة" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <Switch label="ظاهر في المتجر" checked={edit.isActive} onCheckedChange={(v) => setEdit({ ...edit, isActive: v })} />
                  {kind === "category" && <Switch label="يظهر في الصفحة الرئيسية" checked={!!edit.isFeatured} onCheckedChange={(v) => setEdit({ ...edit, isFeatured: v })} />}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setEdit(null)}>
                  إلغاء
                </Button>
                <Button type="submit" loading={pending}>
                  حفظ
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ───────── Size charts ───────── */
type Row = { label: string; euSize: string; bustCm: string; waistCm: string; hipsCm: string };
export type ChartItem = { id?: string; name: string; description: string; measurementType: "BODY" | "GARMENT"; isDefault: boolean; rows: Row[] };

export function SizeChartEditor({ chart, canDelete }: { chart: ChartItem; canDelete: boolean }) {
  const [c, setC] = React.useState(chart);
  const { pending, run } = useRun();
  const setRow = (i: number, patch: Partial<Row>) => setC((x) => ({ ...x, rows: x.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const num = (s: string) => (s.trim() === "" ? null : Math.round(Number(s)));
  return (
    <Card title={c.id ? c.name : "جدول جديد"}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="اسم الجدول" htmlFor={`n-${c.id}`}>
          <Input id={`n-${c.id}`} value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
        </Field>
        <Field label="نوع القياس" htmlFor={`t-${c.id}`}>
          <Select id={`t-${c.id}`} value={c.measurementType} onChange={(e) => setC({ ...c, measurementType: e.target.value as "BODY" })}>
            <option value="BODY">قياسات الجسم</option>
            <option value="GARMENT">قياسات القطعة</option>
          </Select>
        </Field>
        <Field label="ملاحظة تظهر تحت الجدول" htmlFor={`d-${c.id}`} className="sm:col-span-2">
          <Textarea id={`d-${c.id}`} rows={2} value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} />
        </Field>
      </div>
      <Switch label="الجدول الافتراضي للمتجر" checked={c.isDefault} onCheckedChange={(v) => setC({ ...c, isDefault: v })} />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="text-right text-xs text-muted">
            <tr>
              {["المقاس", "أوروبي", "الصدر (سم)", "الخصر (سم)", "الأرداف (سم)", ""].map((h) => (
                <th key={h} className="py-2 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.rows.map((r, i) => (
              <tr key={i} className="border-t border-line/60">
                {(["label", "euSize", "bustCm", "waistCm", "hipsCm"] as const).map((k) => (
                  <td key={k} className="py-1.5 pe-2">
                    <input value={r[k]} onChange={(e) => setRow(i, { [k]: k === "label" ? e.target.value.toUpperCase() : e.target.value.replace(/[^\d]/g, "") })} inputMode={k === "label" ? "text" : "numeric"} className="latin h-9 w-full min-w-16 rounded-lg border border-line px-2 text-[16px]" aria-label={`${k} ${i + 1}`} />
                  </td>
                ))}
                <td className="py-1.5">
                  <Button variant="ghost" size="iconSm" onClick={() => setC({ ...c, rows: c.rows.filter((_, j) => j !== i) })} aria-label="حذف الصف">
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-2">
        <Button variant="soft" size="sm" onClick={() => setC({ ...c, rows: [...c.rows, { label: "", euSize: "", bustCm: "", waistCm: "", hipsCm: "" }] })}>
          <Plus /> صف
        </Button>
        <div className="flex gap-2">
          {c.id && canDelete && !c.isDefault && (
            <Button variant="ghost" size="sm" className="text-danger" onClick={() => confirm("حذف هذا الجدول؟") && run(() => deleteSizeChart(c.id!), "تم الحذف")} disabled={pending}>
              حذف الجدول
            </Button>
          )}
          <Button
            size="sm"
            loading={pending}
            onClick={() =>
              run(
                () =>
                  saveSizeChart({
                    id: c.id,
                    name: c.name,
                    description: c.description,
                    measurementType: c.measurementType,
                    isDefault: c.isDefault,
                    rows: c.rows.filter((r) => r.label.trim()).map((r) => ({ label: r.label, euSize: r.euSize, bustCm: num(r.bustCm), waistCm: num(r.waistCm), hipsCm: num(r.hipsCm) })),
                  }),
                "تم حفظ جدول المقاسات",
              )
            }
          >
            حفظ
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ───────── Delivery cities / areas ───────── */
type City = { id: string; name: string; isActive: boolean; orders: number; areas: { id: string; name: string; isActive: boolean }[] };
export function DeliveryEditor({ cities }: { cities: City[] }) {
  const { pending, run } = useRun();
  const [newCity, setNewCity] = React.useState("");
  const [open, setOpen] = React.useState<string | null>(null);
  return (
    <div className="space-y-3">
      <form
        className="flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveCity({ name: newCity, isActive: true }), "أُضيفت المدينة", () => setNewCity(""));
        }}
      >
        <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="مدينة جديدة" aria-label="مدينة جديدة" />
        <Button type="submit" variant="soft" disabled={!newCity.trim() || pending}>
          <Plus /> إضافة
        </Button>
      </form>
      {cities.map((c) => (
        <div key={c.id} className={cn("rounded-2xl border border-line bg-white", !c.isActive && "opacity-70")}>
          <div className="flex flex-wrap items-center gap-3 p-3">
            <button type="button" onClick={() => setOpen(open === c.id ? null : c.id)} className="flex-1 text-start font-medium" aria-expanded={open === c.id}>
              {c.name} <span className="text-xs font-normal text-muted">· {c.areas.length} منطقة · {c.orders} طلب</span>
            </button>
            <Switch label={<span className="text-xs text-muted">{c.isActive ? "التوصيل متاح" : "متوقف"}</span>} checked={c.isActive} onCheckedChange={(v) => run(() => saveCity({ id: c.id, name: c.name, isActive: v }), v ? "تم تفعيل المدينة" : "تم إيقاف المدينة")} />
          </div>
          {open === c.id && <AreasPanel city={c} run={run} pending={pending} />}
        </div>
      ))}
    </div>
  );
}

function AreasPanel({ city, run, pending }: { city: City; run: ReturnType<typeof useRun>["run"]; pending: boolean }) {
  const [name, setName] = React.useState("");
  return (
    <div className="border-t border-line p-3">
      <ul className="flex flex-wrap gap-2">
        {city.areas.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => run(() => saveArea({ id: a.id, cityId: city.id, name: a.name, isActive: !a.isActive }), a.isActive ? "أُخفيت المنطقة" : "فُعّلت المنطقة")}
              className={cn("rounded-full px-3 py-1.5 text-sm", a.isActive ? "bg-blush text-burgundy" : "bg-stone-100 text-stone-500 line-through")}
              title="اضغطي للتفعيل/الإخفاء"
            >
              {a.name}
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex max-w-sm gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveArea({ cityId: city.id, name, isActive: true }), "أُضيفت المنطقة", () => setName(""));
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="منطقة جديدة" className="h-10" aria-label="منطقة جديدة" />
        <Button type="submit" size="sm" variant="soft" disabled={!name.trim() || pending}>
          إضافة
        </Button>
      </form>
    </div>
  );
}
