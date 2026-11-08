"use client";

import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { deleteTestimonial, saveSiteSettings, saveTestimonial } from "@/app/admin/actions/content";
import { Card } from "@/components/admin/admin-shell";
import { ImageDropzone } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings-schema";

export function SettingsForm({ initial, canEdit }: { initial: SiteSettings; canEdit: boolean }) {
  const router = useRouter();
  const [s, setS] = React.useState(initial);
  const [fee, setFee] = React.useState(String(initial.shipping.fee / 100));
  const [insideFee, setInsideFee] = React.useState(String((initial.shipping.inside48Fee ?? 3000) / 100));
  const [pending, start] = React.useTransition();
  const set = <K extends keyof SiteSettings>(k: K, patch: Partial<SiteSettings[K]>) => setS((x) => ({ ...x, [k]: { ...x[k], ...patch } }));

  const save = () =>
    start(async () => {
      const res = await saveSiteSettings({
        ...s,
        shipping: {
          ...s.shipping,
          fee: Math.round((Number(fee) || 0) * 100),
          inside48Fee: Math.round((Number(insideFee) || 30) * 100),
        },
      });
      if (res.ok) {
        toast.success("تم حفظ الإعدادات وتحديث المتجر");
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div className="space-y-5 pb-24">
      {!canEdit && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">تعديل إعدادات الموقع متاح للمدير فقط.</p>}
      <Card title="شريط الإعلانات المتحرك (Announcement Bar)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Switch label="إظهار الشريط في أعلى الموقع" checked={s.announcement.enabled} onCheckedChange={(v) => set("announcement", { enabled: v })} />
          <Field label="سرعة حركة الشريط المستمر" htmlFor="ann-speed">
            <Select
              id="ann-speed"
              value={s.announcement.speed ?? "normal"}
              onChange={(e) => set("announcement", { speed: e.target.value as "slow" | "normal" | "fast" })}
            >
              <option value="slow">هادئة وفاخرة (بطيئة ~45 ثانية)</option>
              <option value="normal">انسيابية معتدلة (عادية ~32 ثانية)</option>
              <option value="fast">حيوية وسريعة (~20 ثانية)</option>
            </Select>
          </Field>
        </div>

        <div className="mt-4 space-y-2.5">
          <p className="text-xs font-semibold text-muted">العبارات التسويقية المعروضة (يمكن التعديل والترتيب والحذف):</p>
          {s.announcement.messages.map((m, i) => (
            <div key={i} className="flex items-center gap-1.5 sm:gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-blush text-xs font-bold text-burgundy">
                {i + 1}
              </span>
              <Input
                value={m}
                onChange={(e) =>
                  set("announcement", {
                    messages: s.announcement.messages.map((x, j) => (j === i ? e.target.value : x)),
                  })
                }
                aria-label={`عبارة ${i + 1}`}
                placeholder="اكتبي العبارة الإعلانية هنا…"
                className="flex-1"
              />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="iconSm"
                  disabled={i === 0}
                  onClick={() => {
                    const copy = [...s.announcement.messages];
                    const [item] = copy.splice(i, 1);
                    copy.splice(i - 1, 0, item);
                    set("announcement", { messages: copy });
                  }}
                  title="تحريك لأعلى"
                  aria-label="تحريك لأعلى"
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="iconSm"
                  disabled={i === s.announcement.messages.length - 1}
                  onClick={() => {
                    const copy = [...s.announcement.messages];
                    const [item] = copy.splice(i, 1);
                    copy.splice(i + 1, 0, item);
                    set("announcement", { messages: copy });
                  }}
                  title="تحريك لأسفل"
                  aria-label="تحريك لأسفل"
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="iconSm"
                  disabled={s.announcement.messages.length <= 1}
                  onClick={() =>
                    set("announcement", {
                      messages: s.announcement.messages.filter((_, j) => j !== i),
                    })
                  }
                  title="حذف العبارة"
                  aria-label="حذف"
                  className="text-danger hover:bg-rose-50"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          {s.announcement.messages.length < 12 && (
            <Button
              variant="soft"
              size="sm"
              onClick={() => set("announcement", { messages: [...s.announcement.messages, ""] })}
              className="mt-2"
            >
              <Plus className="size-4" /> إضافة عبارة جديدة
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

      <Card title="أقسام الصفحة الرئيسية والتحكم بالعرض">
        <div className="grid gap-2 sm:grid-cols-2">
          <Switch label="وصل حديثاً" checked={s.homepage.showNewArrivals} onCheckedChange={(v) => set("homepage", { showNewArrivals: v })} />
          <Switch label="الأكثر طلباً" checked={s.homepage.showBestSellers} onCheckedChange={(v) => set("homepage", { showBestSellers: v })} />
          <Switch label="المجموعات" checked={s.homepage.showCollections} onCheckedChange={(v) => set("homepage", { showCollections: v })} />
          <Switch label="آراء الزبونات (إن وُجدت)" checked={s.homepage.showTestimonials} onCheckedChange={(v) => set("homepage", { showTestimonials: v })} />
          <Switch label="قسم قصة البوتيك (Our Story)" checked={s.homepage.showStory ?? true} onCheckedChange={(v) => set("homepage", { showStory: v })} />
          <Switch label="موقع المحل وأوقات الدوام" checked={s.homepage.showLocation ?? true} onCheckedChange={(v) => set("homepage", { showLocation: v })} />
        </div>
      </Card>

      <Card title="قصتنا (Our Story)">
        <div className="space-y-4">
          <Switch
            label="تفعيل وعرض قسم القصة في الصفحة الرئيسية"
            checked={s.story?.enabled ?? true}
            onCheckedChange={(v) => set("story", { enabled: v })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="سطر علوي إنجليزي (Eyebrow)" htmlFor="st-ey">
              <Input id="st-ey" dir="ltr" value={s.story?.eyebrow ?? "OUR STORY"} onChange={(e) => set("story", { eyebrow: e.target.value })} />
            </Field>
            <Field label="عنوان القصة الرئيسي" htmlFor="st-ti">
              <Input id="st-ti" value={s.story?.title ?? "حكاية أناقة تبدأ بكِ"} onChange={(e) => set("story", { title: e.target.value })} />
            </Field>
            <Field label="السطر التمهيدي" htmlFor="st-sub" className="sm:col-span-2">
              <Input id="st-sub" value={s.story?.subtitle ?? "لأن الأناقة تبدأ من التفاصيل..."} onChange={(e) => set("story", { subtitle: e.target.value })} />
            </Field>
            <Field label="المقدمة المختصرة (للصفحة الرئيسية)" htmlFor="st-hi" className="sm:col-span-2">
              <Textarea id="st-hi" rows={3} value={s.story?.homeIntro ?? ""} onChange={(e) => set("story", { homeIntro: e.target.value })} />
            </Field>
            <Field label="النص الكامل للقصة (المعروض في صفحة /about)" htmlFor="st-fs" className="sm:col-span-2" hint="افصلي بين كل فقرة بسطر فارغ">
              <Textarea id="st-fs" rows={7} value={s.story?.fullStory ?? ""} onChange={(e) => set("story", { fullStory: e.target.value })} />
            </Field>
            <Field label="العبارة الختامية" htmlFor="st-qt" className="sm:col-span-2">
              <Input id="st-qt" value={s.story?.quote ?? "أناقتكِ... بأسلوب يشبهكِ."} onChange={(e) => set("story", { quote: e.target.value })} />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">صورة القصة التحريرية (اختيارية — نسبة 3:4)</p>
            {s.story?.imageUrl ? (
              <div className="relative w-40">
                <div className="arch relative aspect-[3/4] overflow-hidden rounded-2xl bg-blush">
                  <Image src={s.story.imageUrl} alt="" fill sizes="160px" className="object-cover" />
                </div>
                <Button variant="ghost" size="sm" className="mt-2 text-danger" onClick={() => set("story", { imageUrl: null })}>
                  <Trash2 /> إزالة الصورة
                </Button>
              </div>
            ) : (
              <div className="max-w-xs">
                <ImageDropzone folder="story" multiple={false} onUploaded={(img) => set("story", { imageUrl: img.url })} label="ارفعي صورة بنسبة 3:4" />
              </div>
            )}
          </div>
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

      <Card title="التوصيل والاستبدال والتحكم بأسعار الشحن">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="رسوم توصيل الضفة والقدس (₪)" htmlFor="fee" hint="توصيل مجاني = 0">
            <Input id="fee" inputMode="decimal" dir="ltr" className="text-right" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d.]/g, ""))} />
          </Field>
          <Field label="رسوم توصيل مناطق الداخل (₪)" htmlFor="insideFee" hint="الافتراضي: 30 ₪ (نصف السعر)">
            <Input id="insideFee" inputMode="decimal" dir="ltr" className="text-right" value={insideFee} onChange={(e) => setInsideFee(e.target.value.replace(/[^\d.]/g, ""))} />
          </Field>
          <Field label="رسالة التوصيل العامة (المعروضة في المتجر)" htmlFor="sm" className="sm:col-span-2">
            <Input id="sm" value={s.shipping.message} onChange={(e) => set("shipping", { message: e.target.value })} />
          </Field>
          <Field label="رسالة توصيل مناطق الداخل (في صفحة الدفع)" htmlFor="inmsg" className="sm:col-span-2">
            <Input id="inmsg" value={s.shipping.inside48Message ?? "توصيل مناطق الداخل بـ 30 ₪ (نصف السعر)"} onChange={(e) => set("shipping", { inside48Message: e.target.value })} />
          </Field>
          <Field label="مدة التوصيل" htmlFor="se" className="sm:col-span-2">
            <Input id="se" value={s.shipping.estimate} onChange={(e) => set("shipping", { estimate: e.target.value })} />
          </Field>
          <Field label="سياسة الاستبدال والإرجاع" htmlFor="rp" className="sm:col-span-2">
            <Textarea id="rp" rows={3} value={s.shipping.returnsPolicy} onChange={(e) => set("shipping", { returnsPolicy: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card title="زر واتساب العائم (WhatsApp Floating Button)">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Switch
              label="تفعيل زر واتساب العائم في المتجر"
              checked={s.whatsappButton?.enabled ?? true}
              onCheckedChange={(v) =>
                set("whatsappButton", { ...(s.whatsappButton ?? DEFAULT_SETTINGS.whatsappButton), enabled: v })
              }
            />
            <Switch
              label="إظهار فقاعة ترحيبية ناعمة (Tooltip)"
              checked={s.whatsappButton?.showTooltip ?? true}
              onCheckedChange={(v) =>
                set("whatsappButton", { ...(s.whatsappButton ?? DEFAULT_SETTINGS.whatsappButton), showTooltip: v })
              }
            />
            <Switch
              label="إخفاء الزر تلقائياً في صفحة إتمام الطلب (Checkout)"
              checked={s.whatsappButton?.hideOnCheckout ?? true}
              onCheckedChange={(v) =>
                set("whatsappButton", { ...(s.whatsappButton ?? DEFAULT_SETTINGS.whatsappButton), hideOnCheckout: v })
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="رقم واتساب المخصص للزر" htmlFor="wa-btn-phone" hint="مثال: +970599571202">
              <Input
                id="wa-btn-phone"
                dir="ltr"
                value={s.whatsappButton?.phoneNumber ?? s.business.whatsappNumber}
                onChange={(e) =>
                  set("whatsappButton", { ...(s.whatsappButton ?? DEFAULT_SETTINGS.whatsappButton), phoneNumber: e.target.value })
                }
              />
            </Field>
            <Field label="نص الفقاعة الترحيبية" htmlFor="wa-tooltip-text">
              <Input
                id="wa-tooltip-text"
                value={s.whatsappButton?.tooltipMessage ?? "أهلًا فيكِ 🌸\nمحتاجة مساعدة باختيار إطلالتكِ؟ تواصلي معنا!"}
                onChange={(e) =>
                  set("whatsappButton", { ...(s.whatsappButton ?? DEFAULT_SETTINGS.whatsappButton), tooltipMessage: e.target.value })
                }
              />
            </Field>
            <Field label="الرسالة التلقائية الافتراضية" htmlFor="wa-def-msg" className="sm:col-span-2">
              <Textarea
                id="wa-def-msg"
                rows={2}
                value={s.whatsappButton?.defaultMessage ?? "مرحبًا VETRINA BOUTIQUE 🌸\nحابّة أستفسر عن منتجاتكم، ممكن تساعدوني؟"}
                onChange={(e) =>
                  set("whatsappButton", { ...(s.whatsappButton ?? DEFAULT_SETTINGS.whatsappButton), defaultMessage: e.target.value })
                }
              />
            </Field>
          </div>
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
