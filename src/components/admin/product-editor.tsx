"use client";

import { ArrowLeft, ArrowRight, Bookmark, Check, ChevronLeft, ChevronRight, Copy, Monitor, Plus, Smartphone, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { saveProduct } from "@/app/admin/actions/products";
import { ImageDropzone, type UploadedImage } from "@/components/admin/image-upload";
import { Price } from "@/components/store/price";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import { COLOR_PRESETS, SIZE_PRESETS, type ProductPayload } from "@/lib/product-schema";
import { sortSizes } from "@/lib/sizes";
import { cn } from "@/lib/utils";

export type EditorImage = ProductPayload["images"][number] & { uid: string };
export type EditorVariant = Omit<ProductPayload["variants"][number], "priceAdjustment"> & { uid: string; priceAdjustment: string };
export type EditorState = Omit<ProductPayload, "price" | "salePrice" | "images" | "variants"> & {
  price: string;
  salePrice: string;
  images: EditorImage[];
  variants: EditorVariant[];
};

type Option = { id: string; name: string };

const STEPS = ["الأساسيات", "السعر", "الصور", "الألوان", "المقاسات والمخزون", "النشر و SEO", "المعاينة"];
const uid = () => Math.random().toString(36).slice(2, 10);
const toAg = (s: string) => Math.round(Number(String(s).replace(/,/g, ".")) * 100);
const sizeLabel = (s: string) => (s === "ONE SIZE" ? "مقاس واحد" : s);

function toPayload(s: EditorState): ProductPayload {
  return {
    ...s,
    price: Number.isFinite(toAg(s.price)) ? toAg(s.price) : 0,
    salePrice: s.salePrice.trim() ? toAg(s.salePrice) : null,
    images: s.images.map(({ uid: _u, ...i }) => i),
    variants: s.variants.map(({ uid: _u, ...v }) => ({ ...v, priceAdjustment: v.priceAdjustment.trim() ? toAg(v.priceAdjustment) : 0 })),
  };
}

function stepErrors(s: EditorState, step: number): string[] {
  const e: string[] = [];
  if (step === 0 && s.name.trim().length < 2) e.push("اكتب اسم المنتج");
  if (step === 1) {
    const p = Number(s.price);
    if (!s.price || !Number.isFinite(p) || p <= 0) e.push("أدخل سعراً صحيحاً بالشيكل");
    if (s.salePrice.trim() && !(Number(s.salePrice) > 0 && Number(s.salePrice) < p)) e.push("سعر الخصم يجب أن يكون أقل من السعر الأصلي");
  }
  if (step === 3) {
    if (!s.colors.length) e.push("أضيفي لوناً واحداً على الأقل");
    if (s.colors.some((c) => !c.name.trim())) e.push("لكل لون اسم");
  }
  if (step === 4) {
    for (const c of s.colors) if (!s.variants.some((v) => v.colorKey === c.key)) e.push(`اختاري مقاسات اللون «${c.name || "بدون اسم"}»`);
    if (s.variants.some((v) => !Number.isInteger(v.stock) || v.stock < 0)) e.push("المخزون رقم صحيح غير سالب");
  }
  return e;
}

export function ProductEditor({
  initial,
  categories,
  collections,
  sizeCharts,
}: {
  initial: EditorState;
  categories: Option[];
  collections: Option[];
  sizeCharts: (Option & { isDefault: boolean })[];
}) {
  const router = useRouter();
  const [s, setS] = React.useState<EditorState>(initial);
  const [step, setStep] = React.useState(0);
  const [pending, start] = React.useTransition();
  const [issues, setIssues] = React.useState<string[]>([]);
  const [restorable, setRestorable] = React.useState<EditorState | null>(null);
  const draftKey = `vb-product-draft-${initial.id ?? "new"}`;
  const dirty = React.useRef(false);

  // Local autosave of unsaved edits (browser only; the database is the source of truth).
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw) as { at: number; state: EditorState };
        // Reading browser storage is an external-system sync, done once after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (JSON.stringify(d.state) !== JSON.stringify(initial)) setRestorable(d.state);
      }
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ at: Date.now(), state: s }));
      } catch {
        /* ignore */
      }
    }, 700);
    return () => clearTimeout(t);
  }, [s, draftKey]);
  React.useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  const update = (patch: Partial<EditorState> | ((x: EditorState) => EditorState)) => {
    dirty.current = true;
    setS((x) => (typeof patch === "function" ? patch(x) : { ...x, ...patch }));
  };

  const save = (status: "DRAFT" | "PUBLISHED") => {
    const payload = toPayload({ ...s, status });
    setIssues([]);
    start(async () => {
      const res = await saveProduct(payload);
      if (res.ok) {
        dirty.current = false;
        try {
          localStorage.removeItem(draftKey);
        } catch {
          /* ignore */
        }
        toast.success(status === "PUBLISHED" ? "تم حفظ المنتج ونشره" : "تم حفظ المسودة");
        if (!initial.id) router.replace(`/admin/products/${res.id}`);
        else router.refresh();
        update({ status });
        dirty.current = false;
      } else {
        setIssues(res.issues ?? [res.error]);
        toast.error(res.error);
      }
    });
  };

  const errs = stepErrors(s, step);
  const goNext = () => {
    if (errs.length) return toast.error(errs[0]);
    setStep((x) => Math.min(STEPS.length - 1, x + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="pb-28">
      {restorable && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-950">
          <span>توجد تعديلات غير محفوظة من جلسة سابقة على هذا الجهاز.</span>
          <span className="flex gap-2">
            <Button size="sm" variant="soft" onClick={() => { setS(restorable); dirty.current = true; setRestorable(null); }}>
              استعادة
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { try { localStorage.removeItem(draftKey); } catch {} setRestorable(null); }}>
              تجاهل
            </Button>
          </span>
        </div>
      )}

      <ol className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="خطوات إضافة المنتج">
        {STEPS.map((label, i) => {
          const done = i < step && !stepErrors(s, i).length;
          return (
            <li key={label} className="shrink-0">
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={i === step ? "step" : undefined}
                className={cn("flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition", i === step ? "bg-burgundy text-ivory" : "bg-white text-ink ring-1 ring-line hover:ring-mauve")}
              >
                <span className={cn("latin grid size-5 place-items-center rounded-full text-[11px]", i === step ? "bg-ivory text-burgundy" : done ? "bg-success text-white" : "bg-blush text-burgundy")}>
                  {done ? <Check className="size-3" /> : i + 1}
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border border-line bg-white p-4 sm:p-6">
        {step === 0 && <StepBasics s={s} update={update} categories={categories} />}
        {step === 1 && <StepPrice s={s} update={update} />}
        {step === 2 && <StepImages s={s} update={update} />}
        {step === 3 && <StepColors s={s} update={update} />}
        {step === 4 && <StepSizes s={s} update={update} />}
        {step === 5 && <StepPublish s={s} update={update} collections={collections} sizeCharts={sizeCharts} />}
        {step === 6 && <StepPreview s={s} categories={categories} />}
        {errs.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-danger" role="alert">
            {errs.map((e) => (
              <li key={e}>• {e}</li>
            ))}
          </ul>
        )}
      </div>

      {issues.length > 0 && (
        <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-danger" role="alert">
          <p className="font-medium">لم يتم الحفظ:</p>
          <ul className="mt-1 list-inside list-disc">
            {issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-safe backdrop-blur lg:right-[260px]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-6">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep((x) => Math.max(0, x - 1))} disabled={step === 0}>
              <ArrowRight /> السابق
            </Button>
            {step < STEPS.length - 1 && (
              <Button variant="soft" size="sm" onClick={goNext}>
                التالي <ArrowLeft />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => save("DRAFT")} loading={pending}>
              حفظ كمسودة
            </Button>
            <Button size="sm" onClick={() => save("PUBLISHED")} loading={pending}>
              {s.status === "PUBLISHED" && initial.id ? "حفظ التعديلات" : "حفظ ونشر"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type StepProps = { s: EditorState; update: (p: Partial<EditorState> | ((x: EditorState) => EditorState)) => void };

function StepBasics({ s, update, categories }: StepProps & { categories: Option[] }) {
  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-medium text-burgundy">1. الاسم والقسم والوصف</h2>
      <Field label="اسم المنتج" htmlFor="name" required error={s.name && s.name.trim().length < 2 ? "الاسم قصير جداً" : undefined}>
        <Input id="name" value={s.name} onChange={(e) => update({ name: e.target.value })} placeholder="مثال: عباية كريب انسيابية" />
      </Field>
      <Field label="القسم" htmlFor="category">
        <Select id="category" value={s.categoryId ?? ""} onChange={(e) => update({ categoryId: e.target.value || null })}>
          <option value="">بدون قسم</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="الوصف" htmlFor="description" hint={`${s.description.length}/5000`}>
        <Textarea id="description" rows={6} value={s.description} onChange={(e) => update({ description: e.target.value })} placeholder="القماش، القصّة، الطول، تفاصيل مميزة…" />
      </Field>
      <Field label="العناية بالقطعة (كل تعليمة في سطر)" htmlFor="care">
        <Textarea id="care" rows={4} value={s.careInstructions ?? ""} onChange={(e) => update({ careInstructions: e.target.value })} placeholder={"غسيل يدوي بماء بارد\nكيّ على حرارة منخفضة"} />
      </Field>
    </div>
  );
}

function StepPrice({ s, update }: StepProps) {
  const p = Number(s.price);
  const sp = Number(s.salePrice);
  return (
    <div className="grid gap-4 sm:max-w-md">
      <h2 className="text-lg font-medium text-burgundy">2. السعر بالشيكل (₪)</h2>
      <Field label="السعر" htmlFor="price" required>
        <Input id="price" inputMode="decimal" dir="ltr" className="text-right" value={s.price} onChange={(e) => update({ price: e.target.value.replace(/[^\d.]/g, "") })} placeholder="189" />
      </Field>
      <Field label="سعر الخصم (اختياري)" htmlFor="sale" hint="اتركيه فارغاً إن لم يوجد خصم" error={s.salePrice && !(sp > 0 && sp < p) ? "يجب أن يكون أقل من السعر الأصلي" : undefined}>
        <Input id="sale" inputMode="decimal" dir="ltr" className="text-right" value={s.salePrice} onChange={(e) => update({ salePrice: e.target.value.replace(/[^\d.]/g, "") })} />
      </Field>
      {p > 0 && (
        <div className="rounded-xl bg-blush/60 p-4">
          <p className="mb-1 text-xs text-muted">كما سيظهر للزبونة:</p>
          <Price price={toAg(s.price)} salePrice={s.salePrice && sp < p ? toAg(s.salePrice) : null} size="lg" />
          <p className="mt-1 text-xs text-success">توصيل مجاني — 0 ₪</p>
        </div>
      )}
    </div>
  );
}

function ImageGrid({ images, onChange, coverUid, onCover, empty }: { images: EditorImage[]; onChange: (imgs: EditorImage[]) => void; coverUid: string | null; onCover: (uid: string) => void; empty?: React.ReactNode }) {
  const [dragUid, setDragUid] = React.useState<string | null>(null);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  if (!images.length) return <>{empty}</>;
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {images.map((img, i) => (
        <li
          key={img.uid}
          draggable
          onDragStart={() => setDragUid(img.uid)}
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragUid || dragUid === img.uid) return;
            const from = images.findIndex((x) => x.uid === dragUid);
            const next = [...images];
            const [m] = next.splice(from, 1);
            next.splice(i, 0, m);
            onChange(next);
          }}
          onDragEnd={() => setDragUid(null)}
          className={cn("group relative overflow-hidden rounded-xl bg-blush ring-2 transition", coverUid === img.uid ? "ring-burgundy" : "ring-transparent", dragUid === img.uid && "opacity-50")}
        >
          <div className="relative aspect-[3/4] cursor-grab active:cursor-grabbing">
            <Image src={img.url} alt="" fill sizes="160px" className="object-cover" />
          </div>
          {coverUid === img.uid && <span className="absolute right-1.5 top-1.5 rounded-full bg-burgundy px-2 py-0.5 text-[10px] text-ivory">الغلاف</span>}
          <div className="flex items-center justify-between bg-white/95 p-1">
            <button type="button" onClick={() => move(i, -1)} className="grid size-8 place-items-center rounded-full hover:bg-blush" aria-label="تقديم">
              <ChevronRight className="size-4" />
            </button>
            <button type="button" onClick={() => onCover(img.uid)} className="grid size-8 place-items-center rounded-full hover:bg-blush" aria-label="تعيين كغلاف" title="تعيين كغلاف">
              <Bookmark className={cn("size-4", coverUid === img.uid && "fill-burgundy text-burgundy")} />
            </button>
            <button type="button" onClick={() => onChange(images.filter((x) => x.uid !== img.uid))} className="grid size-8 place-items-center rounded-full text-danger hover:bg-rose-50" aria-label="حذف الصورة">
              <Trash2 className="size-4" />
            </button>
            <button type="button" onClick={() => move(i, 1)} className="grid size-8 place-items-center rounded-full hover:bg-blush" aria-label="تأخير">
              <ChevronLeft className="size-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function useImageOps(s: EditorState, update: StepProps["update"]) {
  const cover = s.images.find((i) => i.isCover)?.uid ?? s.images[0]?.uid ?? null;
  const setCover = (u: string) => update((x) => ({ ...x, images: x.images.map((i) => ({ ...i, isCover: i.uid === u })) }));
  const add = (colorKey: string | null) => (img: UploadedImage) =>
    update((x) => ({ ...x, images: [...x.images, { uid: uid(), url: img.url, key: img.key, width: img.width, height: img.height, colorKey, isCover: x.images.length === 0 }] }));
  const replaceGroup = (colorKey: string | null, imgs: EditorImage[]) =>
    update((x) => {
      const others = x.images.filter((i) => i.colorKey !== colorKey);
      return { ...x, images: colorKey === null ? [...imgs, ...others] : [...others, ...imgs] };
    });
  return { cover, setCover, add, replaceGroup };
}

function StepImages({ s, update }: StepProps) {
  const { cover, setCover, add, replaceGroup } = useImageOps(s, update);
  const general = s.images.filter((i) => !i.colorKey);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-burgundy">3. الصور العامة للمنتج</h2>
        <p className="mt-1 text-sm text-muted">صور تظهر مع كل الألوان (مثل صور التفاصيل). صور كل لون تُضاف في الخطوة التالية. اسحبي لإعادة الترتيب أو استخدمي الأسهم، والنجمة لاختيار صورة الغلاف.</p>
      </div>
      <ImageGrid images={general} onChange={(imgs) => replaceGroup(null, imgs)} coverUid={cover} onCover={setCover} />
      <ImageDropzone onUploaded={add(null)} />
      <p className="text-xs text-muted">الصور تُضغط تلقائياً وتُحوَّل إلى WebP وتُزال منها بيانات الموقع (EXIF).</p>
    </div>
  );
}

function StepColors({ s, update }: StepProps) {
  const { cover, setCover, add, replaceGroup } = useImageOps(s, update);
  const addColor = (name = "", hex = "#1F1A1C") => update((x) => ({ ...x, colors: [...x.colors, { key: uid(), name, hex }] }));
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-medium text-burgundy">4. الألوان وصورها</h2>
        <p className="mt-1 text-sm text-muted">عند اختيار الزبونة للون تظهر صوره ومخزونه فقط. يمكن إضافة صورة واحدة أو عدة صور لكل لون.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {COLOR_PRESETS.map((c) => (
          <button key={c.hex} type="button" onClick={() => addColor(c.name, c.hex)} className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1.5 text-xs hover:border-mauve">
            <span className="size-4 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c.hex }} />
            {c.name}
          </button>
        ))}
        <button type="button" onClick={() => addColor()} className="flex items-center gap-1 rounded-full bg-blush px-3 py-1.5 text-xs text-burgundy">
          <Plus className="size-3.5" /> لون مخصص
        </button>
      </div>
      {s.colors.map((c, ci) => {
        const imgs = s.images.filter((i) => i.colorKey === c.key);
        return (
          <div key={c.key} className="rounded-2xl border border-line p-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="mb-1 block text-xs text-muted">اللون</span>
                <input type="color" value={c.hex} onChange={(e) => update((x) => ({ ...x, colors: x.colors.map((y) => (y.key === c.key ? { ...y, hex: e.target.value.toUpperCase() } : y)) }))} className="h-12 w-14 cursor-pointer rounded-xl border border-line bg-white p-1" aria-label={`عيّنة اللون ${ci + 1}`} />
              </label>
              <label className="min-w-40 flex-1">
                <span className="mb-1 block text-xs text-muted">اسم اللون</span>
                <Input value={c.name} onChange={(e) => update((x) => ({ ...x, colors: x.colors.map((y) => (y.key === c.key ? { ...y, name: e.target.value } : y)) }))} placeholder="مثال: أسود ليلي" />
              </label>
              <Button
                variant="ghost"
                size="sm"
                className="h-12 text-danger"
                onClick={() => {
                  if (!confirm(`حذف اللون «${c.name}» وصوره ومقاساته من النموذج؟`)) return;
                  update((x) => ({ ...x, colors: x.colors.filter((y) => y.key !== c.key), images: x.images.filter((i) => i.colorKey !== c.key), variants: x.variants.filter((v) => v.colorKey !== c.key) }));
                }}
              >
                <Trash2 /> حذف
              </Button>
            </div>
            <div className="mt-4">
              <ImageGrid images={imgs} onChange={(next) => replaceGroup(c.key, next)} coverUid={cover} onCover={setCover} />
              <div className="mt-3 max-w-xs">
                <ImageDropzone onUploaded={add(c.key)} label={`صور اللون ${c.name || ""}`} />
              </div>
            </div>
          </div>
        );
      })}
      {!s.colors.length && <p className="rounded-xl bg-ivory p-4 text-sm text-muted">اختاري لوناً من القائمة أعلاه أو أضيفي لوناً مخصصاً.</p>}
    </div>
  );
}

function StepSizes({ s, update }: StepProps) {
  const [custom, setCustom] = React.useState("");
  const toggle = (colorKey: string, size: string) =>
    update((x) => {
      const has = x.variants.find((v) => v.colorKey === colorKey && v.size === size);
      if (has) return { ...x, variants: x.variants.filter((v) => v !== has) };
      return { ...x, variants: [...x.variants, { uid: uid(), colorKey, size, stock: 0, stockBase: null, priceAdjustment: "", isActive: true }] };
    });
  const setV = (u: string, patch: Partial<EditorVariant>) => update((x) => ({ ...x, variants: x.variants.map((v) => (v.uid === u ? { ...v, ...patch } : v)) }));
  const copyFromFirst = () =>
    update((x) => {
      const first = x.colors[0];
      if (!first) return x;
      const tpl = x.variants.filter((v) => v.colorKey === first.key);
      const next = [...x.variants];
      for (const c of x.colors.slice(1)) {
        for (const t of tpl) if (!next.some((v) => v.colorKey === c.key && v.size === t.size)) next.push({ uid: uid(), colorKey: c.key, size: t.size, stock: 0, stockBase: null, priceAdjustment: t.priceAdjustment, isActive: true });
      }
      return { ...x, variants: next };
    });

  if (!s.colors.length) return <p className="text-sm text-muted">أضيفي الألوان أولاً (الخطوة 4).</p>;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium text-burgundy">5. المقاسات المتاحة لكل لون والمخزون</h2>
          <p className="mt-1 text-sm text-muted">كل تركيبة (لون + مقاس) لها SKU ومخزون مستقل. المقاسات غير المختارة لا تظهر للزبونة.</p>
        </div>
        {s.colors.length > 1 && (
          <Button variant="soft" size="sm" onClick={copyFromFirst}>
            <Copy /> نسخ مقاسات اللون الأول للبقية
          </Button>
        )}
      </div>
      {s.colors.map((c) => {
        const vs = s.variants.filter((v) => v.colorKey === c.key);
        const sizes = [...new Set([...SIZE_PRESETS, ...vs.map((v) => v.size)])];
        return (
          <div key={c.key} className="rounded-2xl border border-line p-4">
            <p className="mb-3 flex items-center gap-2 font-medium">
              <span className="size-5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c.hex }} /> {c.name || "لون بدون اسم"}
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const on = vs.some((v) => v.size === size);
                return (
                  <button key={size} type="button" aria-pressed={on} onClick={() => toggle(c.key, size)} className={cn("latin h-10 min-w-12 rounded-full border px-3 text-sm transition", on ? "border-burgundy bg-burgundy text-ivory" : "border-line hover:border-mauve")}>
                    {sizeLabel(size)}
                  </button>
                );
              })}
            </div>
            {vs.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="text-right text-xs text-muted">
                    <tr>
                      <th className="py-2 font-normal">المقاس</th>
                      <th className="py-2 font-normal">المخزون</th>
                      <th className="py-2 font-normal">فرق السعر (₪)</th>
                      <th className="py-2 font-normal">SKU</th>
                      <th className="py-2 font-normal">متاح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortSizes(vs.map((v) => v.size)).map((size) => {
                      const v = vs.find((x) => x.size === size)!;
                      return (
                        <tr key={v.uid} className="border-t border-line/60">
                          <td className="latin py-2 font-medium">{sizeLabel(v.size)}</td>
                          <td className="py-2">
                            <input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              value={v.stock}
                              onChange={(e) => setV(v.uid, { stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                              className="h-10 w-24 rounded-lg border border-line px-2 text-[16px]"
                              aria-label={`مخزون ${c.name} ${v.size}`}
                            />
                            {v.stockBase != null && v.stock !== v.stockBase && <span className="ms-2 text-xs text-mauve">({v.stock - v.stockBase > 0 ? "+" : ""}{v.stock - v.stockBase})</span>}
                          </td>
                          <td className="py-2">
                            <input value={v.priceAdjustment} onChange={(e) => setV(v.uid, { priceAdjustment: e.target.value.replace(/[^\d.-]/g, "") })} placeholder="0" inputMode="decimal" className="h-10 w-20 rounded-lg border border-line px-2 text-[16px]" aria-label="فرق السعر" />
                          </td>
                          <td className="py-2">
                            <input value={v.sku ?? ""} onChange={(e) => setV(v.uid, { sku: e.target.value.toUpperCase() })} placeholder="تلقائي" dir="ltr" className="latin h-10 w-36 rounded-lg border border-line px-2 text-xs" aria-label="SKU" />
                          </td>
                          <td className="py-2">
                            <input type="checkbox" checked={v.isActive} onChange={(e) => setV(v.uid, { isActive: e.target.checked })} className="size-5 accent-burgundy" aria-label="متاح للبيع" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
      <div className="flex max-w-sm gap-2">
        <Input value={custom} onChange={(e) => setCustom(e.target.value.toUpperCase().slice(0, 12))} placeholder="مقاس مخصص (مثال: 52)" aria-label="مقاس مخصص" />
        <Button
          variant="soft"
          onClick={() => {
            if (!custom.trim() || !s.colors[0]) return;
            toggle(s.colors[0].key, custom.trim());
            setCustom("");
          }}
        >
          إضافة
        </Button>
      </div>
    </div>
  );
}

function StepPublish({ s, update, collections, sizeCharts }: StepProps & { collections: Option[]; sizeCharts: (Option & { isDefault: boolean })[] }) {
  const [tag, setTag] = React.useState("");
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-burgundy">6. الظهور والنشر</h2>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">الحالة</legend>
          {(["DRAFT", "PUBLISHED"] as const).map((st) => (
            <label key={st} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm", s.status === st ? "border-burgundy bg-blush/50" : "border-line")}>
              <input type="radio" name="status" checked={s.status === st} onChange={() => update({ status: st })} className="size-4 accent-burgundy" />
              {st === "DRAFT" ? "مسودة — غير ظاهر في المتجر" : "منشور — ظاهر للعملاء"}
            </label>
          ))}
        </fieldset>
        <Switch label="منتج مميّز" checked={s.isFeatured} onCheckedChange={(v) => update({ isFeatured: v })} />
        <Switch label="ضمن «الأكثر طلباً»" checked={s.isBestSeller} onCheckedChange={(v) => update({ isBestSeller: v })} />
        <Field label="جدول المقاسات" htmlFor="chart" hint="اتركيه على «حسب القسم» لاستخدام جدول القسم أو الافتراضي">
          <Select id="chart" value={s.sizeChartId ?? ""} onChange={(e) => update({ sizeChartId: e.target.value || null })}>
            <option value="">حسب القسم / الافتراضي</option>
            {sizeCharts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isDefault ? " (افتراضي)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        {collections.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium">المجموعات</legend>
            <div className="flex flex-wrap gap-2">
              {collections.map((c) => {
                const on = s.collectionIds.includes(c.id);
                return (
                  <button key={c.id} type="button" aria-pressed={on} onClick={() => update({ collectionIds: on ? s.collectionIds.filter((x) => x !== c.id) : [...s.collectionIds, c.id] })} className={cn("rounded-full border px-3 py-1.5 text-sm", on ? "border-burgundy bg-burgundy text-ivory" : "border-line")}>
                    {c.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      </div>
      <div className="space-y-4">
        <h3 className="font-medium text-burgundy">محركات البحث والوسوم</h3>
        <Field label="عنوان SEO" htmlFor="seoTitle" hint={`${(s.seoTitle ?? "").length}/70 — يُستخدم اسم المنتج إن تُرك فارغاً`}>
          <Input id="seoTitle" maxLength={70} value={s.seoTitle ?? ""} onChange={(e) => update({ seoTitle: e.target.value })} />
        </Field>
        <Field label="وصف SEO" htmlFor="seoDesc" hint={`${(s.seoDescription ?? "").length}/170`}>
          <Textarea id="seoDesc" maxLength={170} rows={3} value={s.seoDescription ?? ""} onChange={(e) => update({ seoDescription: e.target.value })} />
        </Field>
        <Field label="رابط المنتج (slug)" htmlFor="slug" hint="يُنشأ تلقائياً من الاسم">
          <Input id="slug" dir="ltr" className="text-right" value={s.slug ?? ""} onChange={(e) => update({ slug: e.target.value })} />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium">الوسوم</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {s.tags.map((t) => (
              <span key={t} className="flex items-center gap-1 rounded-full bg-blush px-2.5 py-1 text-xs text-burgundy">
                {t}
                <button type="button" onClick={() => update({ tags: s.tags.filter((x) => x !== t) })} aria-label={`إزالة ${t}`}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const t = tag.trim();
              if (t && !s.tags.includes(t)) update({ tags: [...s.tags, t].slice(0, 20) });
              setTag("");
            }}
          >
            <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="أضيفي وسماً ثم Enter" aria-label="وسم جديد" />
            <Button type="submit" variant="soft">
              إضافة
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StepPreview({ s, categories }: { s: EditorState; categories: Option[] }) {
  const [mode, setMode] = React.useState<"mobile" | "desktop">("mobile");
  const [colorKey, setColorKey] = React.useState<string | null>(s.colors[0]?.key ?? null);
  const payload = toPayload(s);
  const cover = s.images.find((i) => i.isCover) ?? s.images[0];
  const total = s.variants.filter((v) => v.isActive).reduce((a, v) => a + v.stock, 0);
  const colorImgs = s.images.filter((i) => i.colorKey === colorKey);
  const shown = colorImgs.length ? colorImgs : s.images;
  const card = {
    id: "preview",
    slug: "#",
    name: s.name || "اسم المنتج",
    price: payload.price,
    salePrice: payload.salePrice,
    isDemo: false,
    isNew: true,
    category: categories.find((c) => c.id === s.categoryId)?.name ?? null,
    image: cover ? { url: cover.url, alt: s.name } : null,
    hoverImage: null,
    colors: s.colors.map((c) => ({ id: c.key, name: c.name, hex: c.hex, image: s.images.find((i) => i.colorKey === c.key)?.url ?? null, inStock: s.variants.some((v) => v.colorKey === c.key && v.stock > 0 && v.isActive) })),
    sizes: [],
    totalStock: total,
    lowStock: total > 0 && total <= 3,
  };
  const colorVariants = s.variants.filter((v) => v.colorKey === colorKey && v.isActive);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-burgundy">7. معاينة قبل النشر</h2>
        <div className="flex rounded-full bg-blush p-1">
          <button type="button" onClick={() => setMode("mobile")} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-sm", mode === "mobile" && "bg-white shadow-sm")} aria-pressed={mode === "mobile"}>
            <Smartphone className="size-4" /> جوال
          </button>
          <button type="button" onClick={() => setMode("desktop")} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-sm", mode === "desktop" && "bg-white shadow-sm")} aria-pressed={mode === "desktop"}>
            <Monitor className="size-4" /> كمبيوتر
          </button>
        </div>
      </div>
      <div className={cn("mx-auto overflow-hidden rounded-[28px] border-8 border-ink/90 bg-ivory transition-all", mode === "mobile" ? "max-w-[390px]" : "max-w-full")}>
        <div className={cn("grid gap-6 p-4", mode === "desktop" && "grid-cols-[1.1fr_1fr] p-8")}>
          <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-blush">
            {shown[0] ? <Image src={shown[0].url} alt="" fill sizes="400px" className="object-cover" /> : <span className="grid size-full place-items-center text-sm text-muted">لا توجد صور</span>}
          </div>
          <div>
            <p className="text-sm text-mauve">{card.category}</p>
            <h3 className="text-2xl font-medium text-burgundy">{card.name}</h3>
            <Price price={payload.price || 0} salePrice={payload.salePrice} size="lg" className="mt-2" />
            <p className="mt-1 text-sm text-success">توصيل مجاني — 0 ₪</p>
            <div className="mt-4 flex gap-2">
              {s.colors.map((c) => (
                <button key={c.key} type="button" onClick={() => setColorKey(c.key)} className={cn("size-9 rounded-full ring-offset-2", colorKey === c.key ? "ring-2 ring-burgundy" : "ring-1 ring-black/10")} style={{ backgroundColor: c.hex }} aria-label={c.name} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {sortSizes(colorVariants.map((v) => v.size)).map((size) => {
                const v = colorVariants.find((x) => x.size === size)!;
                return (
                  <span key={size} className={cn("latin rounded-full border px-4 py-2 text-sm", v.stock > 0 ? "border-line bg-white" : "border-dashed text-muted line-through")}>
                    {sizeLabel(size)}
                  </span>
                );
              })}
            </div>
            <p className="mt-4 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-ink/80">{s.description}</p>
          </div>
        </div>
        <div className="border-t border-line p-4">
          <p className="mb-2 text-xs text-muted">بطاقة المنتج في القوائم:</p>
          <div className="pointer-events-none w-48" inert>
            <ProductCard product={card} wished={false} sizes="200px" />
          </div>
        </div>
      </div>
    </div>
  );
}
