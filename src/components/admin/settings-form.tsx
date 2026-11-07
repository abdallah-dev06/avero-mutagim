"use client";

import { Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { deleteTestimonial, saveSiteSettings, saveTestimonial } from "@/app/admin/actions/content";
import { Card } from "@/components/admin/admin-shell";
import { ImageDropzone } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import type { SiteSettings } from "@/lib/settings-schema";

export function SettingsForm({ initial, canEdit }: { initial: SiteSettings; canEdit: boolean }) {
  const router = useRouter();
  const [s, setS] = React.useState(initial);
  const [fee, setFee] = React.useState(String(initial.shipping.fee / 100));
  const [pending, start] = React.useTransition();
  const set = <K extends keyof SiteSettings>(k: K, patch: Partial<SiteSettings[K]>) => setS((x) => ({ ...x, [k]: { ...x[k], ...patch } }));

  const save = () =>
    start(async () => {
      const res = await saveSiteSettings({ ...s, shipping: { ...s.shipping, fee: Math.round((Number(fee) || 0) * 100) } });
      if (res.ok) {
        toast.success("تم حفظ الإعدادات وتحديث المتجر");
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div className="space-y-5 pb-24">
      {!canEdit && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">تعديل إعدادات الموقع متاح للمدير فقط.</p>}
      <Card title="شريط الإعلانات">
        <Switch label="إظهار الشريط" checked={s.announcement.enabled} onCheckedChange={(v) => set("announcement", { enabled: v })} />
        <div className="mt-3 space-y-2">
          {s.announcement.messages.map((m, i) => (
            <div key={i} className="flex gap-2">
              <Input value={m} onChange={(e) => set("announcement", { messages: s.announcement.messages.map((x, j) => (j === i ? e.target.value : x)) })} aria-label={`رسالة ${i + 1}`} />
              <Button variant="ghost" size="icon" disabled={s.announcement.messages.length <= 1} onClick={() => set("announcement", { messages: s.announcement.messages.filter((_, j) => j !== i) })} aria-label="حذف">
                <X />
              </Button>
            </div>
          ))}
          {s.announcement.messages.length < 5 && (
            <Button variant="soft" size="sm" onClick={() => set("announcement", { messages: [...s.announcement.messages, ""] })}>
              <Plus /> رسالة
            </Button>
          )}
        </div>
      </Card>

      <Card title="الواجهة الرئيسية (Hero)">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <Field label="سطر علوي صغير" htmlFor="eyebrow">
              <Input id="eyebrow" value={s.hero.eyebrow} onChange={(e) => set("hero", { eyebrow: e.target.value })} />
            </Field>
            <Field label="العنوان الرئيسي" htmlFor="htitle" required>
              <Input id="htitle" value={s.hero.title} onChange={(e) => set("hero", { title: e.target.value })} />
            </Field>
            <Field label="النص التعريفي" htmlFor="hsub">
              <Textarea id="hsub" rows={3} value={s.hero.subtitle} onChange={(e) => set("hero", { subtitle: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="الزر الأول" htmlFor="c1l">
                <Input id="c1l" value={s.hero.primaryCta.label} onChange={(e) => set("hero", { primaryCta: { ...s.hero.primaryCta, label: e.target.value } })} />
              </Field>
              <Field label="رابطه" htmlFor="c1h">
                <Input id="c1h" dir="ltr" value={s.hero.primaryCta.href} onChange={(e) => set("hero", { primaryCta: { ...s.hero.primaryCta, href: e.target.value } })} />
              </Field>
              <Field label="الزر الثاني" htmlFor="c2l">
                <Input id="c2l" value={s.hero.secondaryCta.label} onChange={(e) => set("hero", { secondaryCta: { ...s.hero.secondaryCta, label: e.target.value } })} />
              </Field>
              <Field label="رابطه" htmlFor="c2h">
                <Input id="c2h" dir="ltr" value={s.hero.secondaryCta.href} onChange={(e) => set("hero", { secondaryCta: { ...s.hero.secondaryCta, href: e.target.value } })} />
              </Field>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">صورة الواجهة (اختيارية — بدونها يظهر الشعار المتحرك)</p>
            {s.hero.imageUrl ? (
              <div className="relative w-48">
                <div className="arch relative aspect-[3/4] overflow-hidden bg-blush">
                  <Image src={s.hero.imageUrl} alt="" fill sizes="192px" className="object-cover" />
                </div>
                <Button variant="ghost" size="sm" className="mt-2 text-danger" onClick={() => set("hero", { imageUrl: null })}>
                  <Trash2 /> إزالة الصورة
                </Button>
              </div>
            ) : (
              <div className="max-w-xs">
                <ImageDropzone folder="hero" multiple={false} onUploaded={(img) => set("hero", { imageUrl: img.url })} label="ارفعي صورة بنسبة 3:4" />
              </div>
            )}
            <Field label="وصف الصورة (لقارئات الشاشة)" htmlFor="halt">
              <Input id="halt" value={s.hero.imageAlt} onChange={(e) => set("hero", { imageAlt: e.target.value })} />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="أقسام الصفحة الرئيسية">
        <div className="grid gap-1 sm:grid-cols-2">
          <Switch label="وصل حديثاً" checked={s.homepage.showNewArrivals} onCheckedChange={(v) => set("homepage", { showNewArrivals: v })} />
          <Switch label="الأكثر طلباً" checked={s.homepage.showBestSellers} onCheckedChange={(v) => set("homepage", { showBestSellers: v })} />
          <Switch label="المجموعات" checked={s.homepage.showCollections} onCheckedChange={(v) => set("homepage", { showCollections: v })} />
          <Switch label="آراء الزبونات (إن وُجدت)" checked={s.homepage.showTestimonials} onCheckedChange={(v) => set("homepage", { showTestimonials: v })} />
        </div>
        <div className="mt-4 grid gap-3">
          <Field label="عنوان قسم القصة" htmlFor="st">
            <Input id="st" value={s.homepage.storyTitle} onChange={(e) => set("homepage", { storyTitle: e.target.value })} />
          </Field>
          <Field label="نص القصة" htmlFor="stx">
            <Textarea id="stx" rows={3} value={s.homepage.storyText} onChange={(e) => set("homepage", { storyText: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card title="بيانات المتجر والتواصل">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="اسم المتجر" htmlFor="bn">
            <Input id="bn" value={s.business.name} onChange={(e) => set("business", { name: e.target.value })} />
          </Field>
          <Field label="رقم واتساب المتجر" htmlFor="wa" hint="يُحفظ بالصيغة الدولية">
            <Input id="wa" dir="ltr" className="text-right" value={s.business.whatsappNumber} onChange={(e) => set("business", { whatsappNumber: e.target.value })} />
          </Field>
          <Field label="رابط إنستغرام" htmlFor="ig">
            <Input id="ig" dir="ltr" value={s.business.instagramUrl} onChange={(e) => set("business", { instagramUrl: e.target.value })} />
          </Field>
          <Field label="رابط فيسبوك" htmlFor="fb">
            <Input id="fb" dir="ltr" value={s.business.facebookUrl} onChange={(e) => set("business", { facebookUrl: e.target.value })} />
          </Field>
          <Field label="البريد الإلكتروني" htmlFor="em">
            <Input id="em" dir="ltr" value={s.business.email} onChange={(e) => set("business", { email: e.target.value })} />
          </Field>
          <Field label="العنوان" htmlFor="ad">
            <Input id="ad" value={s.business.address} onChange={(e) => set("business", { address: e.target.value })} />
          </Field>
          <Field label="ساعات العمل" htmlFor="hr">
            <Input id="hr" value={s.business.hours} onChange={(e) => set("business", { hours: e.target.value })} />
          </Field>
        </div>
        <Field label="نبذة الفوتر" htmlFor="ft" className="mt-3">
          <Textarea id="ft" rows={2} value={s.footer.about} onChange={(e) => set("footer", { about: e.target.value })} />
        </Field>
      </Card>

      <Card title="التوصيل والاستبدال">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="رسوم التوصيل (₪)" htmlFor="fee" hint="السياسة الافتراضية: توصيل مجاني = 0">
            <Input id="fee" inputMode="decimal" dir="ltr" className="text-right" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d.]/g, ""))} />
          </Field>
          <Field label="رسالة التوصيل" htmlFor="sm">
            <Input id="sm" value={s.shipping.message} onChange={(e) => set("shipping", { message: e.target.value })} />
          </Field>
          <Field label="مدة التوصيل" htmlFor="se" className="sm:col-span-2">
            <Input id="se" value={s.shipping.estimate} onChange={(e) => set("shipping", { estimate: e.target.value })} />
          </Field>
          <Field label="سياسة الاستبدال والإرجاع" htmlFor="rp" className="sm:col-span-2">
            <Textarea id="rp" rows={3} value={s.shipping.returnsPolicy} onChange={(e) => set("shipping", { returnsPolicy: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card title="SEO والمخزون والتقارير">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="عنوان الموقع" htmlFor="seot" hint={`${s.seo.title.length}/70`}>
            <Input id="seot" maxLength={70} value={s.seo.title} onChange={(e) => set("seo", { title: e.target.value })} />
          </Field>
          <Field label="وصف الموقع" htmlFor="seod" hint={`${s.seo.description.length}/170`}>
            <Textarea id="seod" maxLength={170} rows={2} value={s.seo.description} onChange={(e) => set("seo", { description: e.target.value })} />
          </Field>
          <Field label="حد تنبيه المخزون المنخفض" htmlFor="lst">
            <Input id="lst" type="number" min={0} value={s.inventory.defaultLowStockThreshold} onChange={(e) => set("inventory", { defaultLowStockThreshold: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
          </Field>
          <Field label="احتساب الإيراد المحقق في لوحة التحكم" htmlFor="rev">
            <Select id="rev" value={s.revenue.recognizeOn} onChange={(e) => set("revenue", { recognizeOn: e.target.value as "DELIVERED" | "PAID" })}>
              <option value="DELIVERED">عند «تم التسليم»</option>
              <option value="PAID">عند تسجيل الدفع «مدفوع»</option>
            </Select>
          </Field>
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-safe backdrop-blur lg:right-[260px]">
        <div className="mx-auto flex max-w-[1400px] justify-end px-4 py-3">
          <Button onClick={save} loading={pending} disabled={!canEdit}>
            حفظ الإعدادات
          </Button>
        </div>
      </div>
    </div>
  );
}

type T = { id: string; name: string; city: string | null; text: string; rating: number; isActive: boolean };
export function TestimonialsManager({ items }: { items: T[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [draft, setDraft] = React.useState({ name: "", city: "", text: "", rating: 5 });
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(msg);
        after?.();
        router.refresh();
      } else toast.error(r.error);
    });
  return (
    <Card title="آراء الزبونات">
      <p className="mb-3 text-xs text-muted">أضيفي آراء حقيقية فقط (بإذن الزبونة). لا يظهر القسم إن لم توجد آراء مفعّلة.</p>
      <ul className="space-y-2">
        {items.map((t) => (
          <li key={t.id} className="flex items-start justify-between gap-3 rounded-xl border border-line p-3 text-sm">
            <div>
              <p>«{t.text}»</p>
              <p className="mt-1 text-xs text-muted">
                {t.name}
                {t.city ? `، ${t.city}` : ""} · {"●".repeat(t.rating)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Switch label={<span className="sr-only">مفعّل</span>} checked={t.isActive} onCheckedChange={(v) => run(() => saveTestimonial({ ...t, city: t.city ?? undefined, isActive: v }), "تم التحديث")} />
              <Button variant="ghost" size="iconSm" onClick={() => confirm("حذف هذا الرأي؟") && run(() => deleteTestimonial(t.id), "تم الحذف")} aria-label="حذف" disabled={pending}>
                <Trash2 />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <form
        className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_100px]"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveTestimonial({ ...draft, city: draft.city || undefined, isActive: true }), "أُضيف الرأي", () => setDraft({ name: "", city: "", text: "", rating: 5 }));
        }}
      >
        <Input placeholder="الاسم" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required aria-label="الاسم" />
        <Input placeholder="المدينة" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} aria-label="المدينة" />
        <Select value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })} aria-label="التقييم">
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} نقاط ({"●".repeat(r)})
            </option>
          ))}
        </Select>
        <Textarea placeholder="نص الرأي" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} required className="sm:col-span-3" rows={2} aria-label="نص الرأي" />
        <Button type="submit" variant="soft" loading={pending} className="sm:col-span-3 sm:justify-self-end">
          <Plus /> إضافة رأي
        </Button>
      </form>
    </Card>
  );
}
