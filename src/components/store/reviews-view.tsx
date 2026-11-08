"use client";

import { CheckCircle2, MessageSquareHeart, PenLine, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { submitCustomerReview } from "@/app/(store)/actions";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export type ReviewItem = {
  id: string;
  name: string;
  city: string | null;
  text: string;
  rating: number;
  createdAt: Date | string;
};

const RATING_DESCRIPTIONS: Record<number, string> = {
  5: "تجربة استثنائية (5 من 5)",
  4: "راقية جداً (4 من 5)",
  3: "جيدة (3 من 5)",
  2: "مقبولة (2 من 5)",
  1: "تحتاج لتحسين (1 من 5)",
};

export function ReviewsView({ initialReviews }: { initialReviews: ReviewItem[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);

  // Form State
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [rating, setRating] = React.useState(5);
  const [text, setText] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("يرجى إدخال اسمكِ الكريم");
    if (!text.trim() || text.trim().length < 5) return toast.error("يرجى كتابة رأيكِ بما لا يقل عن 5 أحرف");

    startTransition(async () => {
      const res = await submitCustomerReview({
        name: name.trim(),
        city: city.trim() || undefined,
        rating,
        text: text.trim(),
      });

      if (res.ok) {
        toast.success("شكراً لمشاركتكِ رأيكِ القيّم! تم نشر تقييمكِ بنجاح 🤍");
        setModalOpen(false);
        setName("");
        setCity("");
        setText("");
        setRating(5);
        router.refresh();
      } else {
        toast.error(res.error || "تعذّر إرسال التقييم، يرجى المحاولة لاحقاً");
      }
    });
  };

  const totalReviews = initialReviews.length;
  const avgRating = totalReviews
    ? (initialReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : null;

  return (
    <div>
      {/* ───────────── Header / Summary Card ───────────── */}
      <div className="relative overflow-hidden rounded-[28px] border border-gold/30 bg-gradient-to-br from-[#331322] via-[#2a101c] to-[#1f0b15] p-6 sm:p-10 text-ivory shadow-[0_15px_40px_rgba(45,18,32,0.35)]">
        {/* Background glow accents */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-gold/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-20 size-60 rounded-full bg-mauve/20 blur-3xl"
        />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.7)]" />
              <span className="latin font-display text-xs uppercase tracking-[0.3em] text-dusty">
                CUSTOMER REVIEWS & EXPERIENCES
              </span>
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ivory">
              آراء وتجارب حقيقية من زبوناتنا
            </h2>
            <p className="mt-2 max-w-xl text-xs sm:text-sm text-ivory/80 leading-relaxed">
              كل كلمة تُكتب هنا تمثل تجربة حقيقية لزبونة اختارت فيترينا بوتيك. نقرأ آراءكن بامتنان ونعمل دائماً لنكون عند حسن ظنكن.
            </p>

            {avgRating && (
              <div className="mt-5 flex items-center gap-3">
                <span className="latin text-3xl font-bold text-gold">{avgRating}</span>
                <div>
                  {/* Luxury 5 Dots for Rating (Strictly NO stars!) */}
                  <div className="flex items-center gap-1.5" aria-label={`متوسط التقييم ${avgRating} من 5`}>
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <span
                        key={dot}
                        className={cn(
                          "size-2.5 rounded-full transition-colors",
                          dot <= Math.round(Number(avgRating)) ? "bg-gold" : "bg-gold/25"
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-dusty">بناءً على {totalReviews} تقييم حقيقي</p>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#f3e5ab] via-[#dfb652] to-[#b88a6a] px-6 sm:px-8 py-3.5 text-sm sm:text-base font-bold text-burgundy-950 shadow-[0_6px_25px_rgba(212,175,55,0.3)] transition-all hover:brightness-105 active:scale-[0.98]"
            >
              <PenLine className="size-4 transition-transform group-hover:rotate-12" />
              <span>شاركينا تجربتكِ</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───────────── Reviews Grid or Clean Empty State ───────────── */}
      <div className="mt-12">
        {totalReviews > 0 ? (
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {initialReviews.map((r) => (
              <StaggerItem key={r.id}>
                <div className="flex h-full flex-col justify-between rounded-3xl border border-line bg-white p-6 sm:p-7 shadow-[var(--shadow-soft)] transition-all duration-300 hover:border-gold/40 hover:shadow-md">
                  <div>
                    {/* Header: Customer Name + Verified Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush font-bold text-burgundy text-sm">
                          {r.name.trim()[0] || "ز"}
                        </span>
                        <div>
                          <h3 className="font-bold text-burgundy text-base">{r.name}</h3>
                          {r.city && <p className="text-xs text-muted">{r.city}</p>}
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
                        <CheckCircle2 className="size-3" />
                        موثق
                      </span>
                    </div>

                    {/* 5 Luxury Indicator Dots (Strictly NO stars!) */}
                    <div className="mt-4 flex items-center justify-between border-y border-line/60 py-2.5">
                      <div className="flex items-center gap-1.5" aria-label={`التقييم ${r.rating} من 5`}>
                        {[1, 2, 3, 4, 5].map((dot) => (
                          <span
                            key={dot}
                            className={cn(
                              "size-2.5 rounded-full transition-colors",
                              dot <= r.rating ? "bg-gold" : "bg-gold/20"
                            )}
                          />
                        ))}
                      </div>
                      <span className="latin text-xs font-bold text-gold">
                        {r.rating} / 5
                      </span>
                    </div>

                    {/* Review text */}
                    <blockquote className="mt-4 text-sm sm:text-base leading-[1.9] text-ink/90">
                      «{r.text}»
                    </blockquote>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-line/50 pt-3 text-[11px] text-muted">
                    <span>تجربة شراء موثوقة</span>
                    <span className="latin">
                      {new Date(r.createdAt).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          /* Real Empty State (Zero Fake Data) */
          <div className="rounded-[28px] border border-dashed border-line bg-white/80 p-10 sm:p-16 text-center shadow-sm">
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-blush text-burgundy shadow-sm">
              <MessageSquareHeart className="size-8" />
            </span>
            <h3 className="mt-5 text-xl sm:text-2xl font-bold text-burgundy">
              كوني أول من يشاركنا رأيها
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-relaxed">
              لا نضع تقييمات وهمية؛ نعتز بكل تجربة حقيقية من زبوناتنا ونسعد بسماع رأيكِ الصادق في قطعنا وخدمتنا.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-burgundy px-7 py-3 text-sm font-bold text-ivory shadow-md transition-all hover:bg-burgundy-900 active:scale-[0.98]"
            >
              <PenLine className="size-4" />
              <span>أضيفي تقييمكِ الآن</span>
            </button>
          </div>
        )}
      </div>

      {/* ───────────── Bottom Brand Signature Quote ───────────── */}
      <div className="mt-14 rounded-3xl border border-gold/30 bg-gradient-to-r from-blush/60 via-white to-blush/60 p-8 text-center shadow-sm">
        <span className="latin font-display text-sm tracking-[0.3em] text-burgundy font-bold uppercase">
          VETRINA BOUTIQUE
        </span>
        <p className="mt-2 text-lg sm:text-2xl font-bold text-burgundy">
          ثقتكن فينا أجمل تفاصيل حكايتنا 💗
        </p>
        <p className="mt-2 text-xs sm:text-sm text-muted">
          شكراً لكل زبونة تشاركنا فرحتها وأناقتها بقطع فيترينا المميزة
        </p>
      </div>

      {/* ───────────── Professional Review Modal Form ───────────── */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-review-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_.2s_ease]"
        >
          <div className="relative w-full max-w-lg rounded-[28px] border border-gold/40 bg-ivory p-6 sm:p-8 shadow-2xl">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute left-5 top-5 grid size-9 place-items-center rounded-full text-muted transition hover:bg-blush hover:text-burgundy"
              aria-label="إغلاق النافذة"
            >
              <X className="size-5" />
            </button>

            {/* Modal Title */}
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-gold" />
                <span className="text-xs font-bold uppercase tracking-wider text-mauve">
                  VETRINA BOUTIQUE
                </span>
              </div>
              <h3 id="modal-review-title" className="mt-2 text-xl sm:text-2xl font-bold text-burgundy">
                شاركينا رأيكِ وتجربتكِ
              </h3>
              <p className="mt-1 text-xs text-muted">
                رأيكِ أمانة نعتز بها ويساعدنا دائماً على تقديم الأفضل والأرقى لكِ.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="الاسم الكامل" htmlFor="rev-name" required>
                  <Input
                    id="rev-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: ريم أحمد"
                    required
                  />
                </Field>

                <Field label="المدينة أو المنطقة" htmlFor="rev-city">
                  <Input
                    id="rev-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="مثال: رام الله، القدس، نابلس…"
                  />
                </Field>
              </div>

              {/* Interactive 5-Dots Rating Selector (Strictly NO stars!) */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-burgundy">
                  درجة رضاكِ عن التجربة:
                </label>
                <div className="flex items-center justify-between rounded-2xl border border-line bg-white p-3">
                  <div className="flex items-center gap-2" role="group" aria-label="اختيار التقييم من 1 إلى 5 نقاط">
                    {[1, 2, 3, 4, 5].map((pt) => {
                      const active = pt <= rating;
                      return (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => setRating(pt)}
                          title={`${pt} نقاط`}
                          aria-pressed={rating === pt}
                          className={cn(
                            "grid size-9 sm:size-10 place-items-center rounded-full text-xs font-bold transition-all",
                            active
                              ? "scale-105 bg-gradient-to-br from-[#f3e5ab] via-[#dfb652] to-[#b88a6a] text-burgundy-950 shadow-sm"
                              : "bg-blush/60 text-muted hover:bg-blush"
                          )}
                        >
                          <span className="size-2 rounded-full bg-current mb-0.5" />
                          <span className="latin text-[10px] leading-none">{pt}</span>
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-semibold text-gold pe-1">
                    {RATING_DESCRIPTIONS[rating]}
                  </span>
                </div>
              </div>

              {/* Feedback Textarea */}
              <Field label="تفاصيل رأيكِ وتجربتكِ" htmlFor="rev-text" required hint="القطع، المقاس، سرعة التوصيل، التغليف…">
                <Textarea
                  id="rev-text"
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="اكتبي رأيكِ الصادق بكل حرية وراحة…"
                  required
                />
              </Field>

              {/* Submit Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full px-5 py-2.5 text-sm text-muted transition hover:bg-blush"
                >
                  إلغاء
                </button>
                <Button type="submit" loading={pending} disabled={pending} className="px-7 rounded-full">
                  إرسال ونشر التقييم
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
