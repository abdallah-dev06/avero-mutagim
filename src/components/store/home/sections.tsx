"use client";

import { ArrowLeft, ArrowRight, Banknote, Calendar, Clock, ExternalLink, Gem, MapPin, RefreshCcw, Sparkles, Truck } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { CurtainReveal, Parallax, Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { ProductCard } from "@/components/store/product-card";
import { InstagramIcon, FacebookIcon, WhatsAppIcon } from "@/components/store/social-icons";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/misc";
import type { ProductCardData } from "@/server/catalog";
import { cn } from "@/lib/utils";

/* ───────────── Marquee ───────────── */
export function MarqueeBand({ items }: { items: string[] }) {
  const row = [...items, ...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-burgundy/10 bg-ivory py-4" aria-hidden>
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap motion-reduce:animate-none">
        {[...row, ...row].map((t, i) => (
          <span key={i} className="flex items-center gap-10 text-sm tracking-wide text-burgundy/80 md:text-base">
            {t}
            <span className="text-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Categories ───────────── */
type Cat = { slug: string; name: string; nameEn: string | null; imageUrl: string | null; _count: { products: number } };

export function CategoryShowcase({ categories }: { categories: Cat[] }) {
  if (!categories.length) return null;
  return (
    <section className="py-16 md:py-24" aria-labelledby="cats-title">
      <div className="container-lux">
        <Reveal>
          <SectionHeading
            eyebrow="Categories"
            title="تسوّقي حسب القسم"
            action={
              <Link href="/categories" className="group inline-flex items-center gap-1.5 text-sm text-burgundy">
                كل الأقسام <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              </Link>
            }
          />
        </Reveal>
      </div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:gap-5 sm:px-6 lg:container-lux lg:grid lg:grid-cols-5 lg:overflow-visible">
        {categories.map((c, i) => (
          <Reveal key={c.slug} delay={i * 0.08} className="w-[42vw] max-w-[220px] shrink-0 snap-start sm:w-[30vw] lg:w-auto lg:max-w-none">
            <Link href={`/category/${c.slug}`} className="group block">
              <CurtainReveal className="arch aspect-[3/4] bg-blush" delay={i * 0.08}>
                {c.imageUrl ? (
                  <Image src={c.imageUrl} alt={c.name} fill sizes="(min-width:1024px) 20vw, 42vw" className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-lux)] group-hover:scale-105" />
                ) : (
                  <div className="grid size-full place-items-center font-display text-5xl text-dusty">{c.nameEn?.[0] ?? c.name[0]}</div>
                )}
              </CurtainReveal>
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-burgundy">{c.name}</h3>
                {c.nameEn && <p className="latin mt-0.5 font-display text-[11px] uppercase tracking-[0.3em] text-mauve">{c.nameEn}</p>}
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────── Product rail / grid ───────────── */
export function ProductRail({ eyebrow, title, href, products, wishlistIds }: { eyebrow: string; title: string; href: string; products: ProductCardData[]; wishlistIds: string[] }) {
  const scroller = React.useRef<HTMLDivElement>(null);
  if (!products.length) return null;
  const scroll = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="py-14 md:py-20">
      <div className="container-lux">
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            action={
              <div className="flex items-center gap-2">
                <div className="hidden gap-2 md:flex">
                  <button type="button" onClick={() => scroll(1)} aria-label="السابق" className="grid size-11 place-items-center rounded-full border border-line text-burgundy transition hover:border-burgundy">
                    <ArrowRight className="size-4" />
                  </button>
                  <button type="button" onClick={() => scroll(-1)} aria-label="التالي" className="grid size-11 place-items-center rounded-full border border-line text-burgundy transition hover:border-burgundy">
                    <ArrowLeft className="size-4" />
                  </button>
                </div>
                <Link href={href} className="group inline-flex items-center gap-1.5 text-sm text-burgundy">
                  عرض الكل <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                </Link>
              </div>
            }
          />
        </Reveal>
      </div>
      <div ref={scroller} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4 sm:gap-5 sm:px-6 lg:scroll-px-10 lg:px-10 xl:px-[max(2.5rem,calc((100vw-1320px)/2+2.5rem))]">
        {products.map((p, i) => (
          <Reveal key={p.id} delay={Math.min(i, 4) * 0.07} className="w-[46vw] max-w-[300px] shrink-0 snap-start sm:w-[31vw] lg:w-[23%]">
            <ProductCard product={p} wished={wishlistIds.includes(p.id)} sizes="(min-width:1024px) 23vw, 46vw" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function ProductShowcaseGrid({ eyebrow, title, href, products, wishlistIds }: { eyebrow: string; title: string; href: string; products: ProductCardData[]; wishlistIds: string[] }) {
  if (!products.length) return null;
  return (
    <section className="py-14 md:py-20">
      <div className="container-lux">
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            action={
              <Link href={href} className="group inline-flex items-center gap-1.5 text-sm text-burgundy">
                عرض الكل <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              </Link>
            }
          />
        </Reveal>
        <Stagger className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
          {products.map((p, i) => (
            <StaggerItem key={p.id}>
              <ProductCard product={p} wished={wishlistIds.includes(p.id)} priority={i < 2} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────────── Story (scroll-linked) ───────────── */
export function StorySection({ title, text }: { title: string; text: string }) {
  const ref = React.useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const spacing = useTransform(scrollYProgress, [0, 0.5, 1], reduce ? ["0.15em", "0.15em", "0.15em"] : ["0.6em", "0.12em", "0.3em"]);
  const x = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["8%", "-8%"]);
  const ringRotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120]);
  return (
    <section ref={ref} className="relative overflow-hidden bg-burgundy py-20 text-ivory md:py-32">
      <motion.div aria-hidden style={{ rotate: ringRotate }} className="pointer-events-none absolute -left-40 top-1/2 size-[34rem] -translate-y-1/2 rounded-full border border-gold/25 md:size-[44rem]">
        <span className="absolute left-1/2 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/70" />
      </motion.div>
      <motion.p
        aria-hidden
        style={{ letterSpacing: spacing, x }}
        className="latin pointer-events-none select-none whitespace-nowrap text-center font-display text-[18vw] font-medium leading-none text-ivory/[0.07] md:text-[13vw]"
      >
        VETRINA
      </motion.p>
      <div className="container-lux relative -mt-[8vw] grid gap-10 md:grid-cols-12">
        <Reveal className="md:col-span-5 md:col-start-2">
          <p className="latin font-display text-sm uppercase tracking-[0.4em] text-dusty">Our Story</p>
          <h2 className="mt-3 text-3xl font-medium leading-tight md:text-5xl">{title}</h2>
        </Reveal>
        <Reveal delay={0.15} className="md:col-span-5">
          <p className="text-lg leading-[2] text-ivory/80">{text}</p>
          <Link href="/shop" className={cn(buttonVariants({ variant: "secondary" }), "mt-8 border-ivory/30 bg-transparent text-ivory hover:border-ivory hover:bg-ivory hover:text-burgundy")}>
            اكتشفي المجموعة
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────── Collections ───────────── */
type Col = { slug: string; name: string; nameEn: string | null; description: string | null; imageUrl: string | null };
export function CollectionsSection({ collections }: { collections: Col[] }) {
  if (!collections.length) return null;
  return (
    <section className="py-16 md:py-24">
      <div className="container-lux">
        <Reveal>
          <SectionHeading eyebrow="Collections" title="مجموعات مختارة" description="تنسيقات جاهزة بعناية لتسهّل عليك الاختيار." />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {collections.slice(0, 4).map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.1}>
              <Link href={`/collections/${c.slug}`} className="group relative block overflow-hidden rounded-[28px]">
                <Parallax className="aspect-[4/5] bg-blush sm:aspect-[5/4]" offset={40}>
                  {c.imageUrl && <Image src={c.imageUrl} alt={c.name} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-lux)] group-hover:scale-105" />}
                </Parallax>
                <div className="absolute inset-0 bg-gradient-to-t from-burgundy-900/80 via-burgundy-900/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-ivory md:p-9">
                  {c.nameEn && <p className="latin font-display text-xs uppercase tracking-[0.35em] text-dusty">{c.nameEn}</p>}
                  <h3 className="mt-2 text-2xl font-medium md:text-3xl">{c.name}</h3>
                  {c.description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-ivory/80">{c.description}</p>}
                  <span className="mt-4 inline-flex items-center gap-2 border-b border-ivory/40 pb-1 text-sm transition-colors group-hover:border-ivory">
                    تسوّقي المجموعة <ArrowLeft className="size-4 transition-transform duration-500 group-hover:-translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Benefits ───────────── */
export function Benefits({ shippingMessage, estimate }: { shippingMessage: string; estimate: string }) {
  const items = [
    { icon: Truck, title: shippingMessage, text: estimate },
    { icon: Banknote, title: "الدفع عند الاستلام", text: "ادفعي نقداً عند وصول طلبك بكل راحة." },
    { icon: RefreshCcw, title: "استبدال سهل", text: "تواصلي معنا عبر واتساب لترتيب الاستبدال." },
    { icon: Gem, title: "جودة مختارة", text: "نفحص كل قطعة قبل تغليفها وإرسالها لك." },
  ];
  return (
    <section className="border-y border-line bg-white/60 py-12 md:py-16">
      <Stagger className="container-lux grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4">
        {items.map((it) => (
          <StaggerItem key={it.title} className="flex flex-col items-center text-center">
            <span className="grid size-14 place-items-center rounded-full bg-blush text-burgundy">
              <it.icon className="size-6" strokeWidth={1.5} />
            </span>
            <h3 className="mt-4 font-medium text-burgundy">{it.title}</h3>
            <p className="mt-1.5 max-w-[16rem] text-sm leading-relaxed text-muted">{it.text}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* ───────────── Testimonials (only real, admin-entered) ───────────── */
export function Testimonials({ items }: { items: { id: string; name: string; city: string | null; text: string; rating: number }[] }) {
  if (!items.length) return null;
  return (
    <section className="py-16 md:py-24">
      <div className="container-lux">
        <Reveal>
          <SectionHeading eyebrow="Kind Words" title="آراء زبوناتنا" />
        </Reveal>
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:px-0">
          {items.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08} className="w-[82vw] max-w-sm shrink-0 snap-start md:w-auto md:max-w-none">
              <figure className="h-full rounded-[24px] border border-line bg-white p-6 shadow-[var(--shadow-soft)]">
                <div className="flex items-center gap-1.5" aria-label={`التقييم ${t.rating} من 5`}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "size-2.5 rounded-full transition-colors",
                        idx < Math.max(1, Math.min(5, t.rating)) ? "bg-gold" : "bg-gold/20"
                      )}
                    />
                  ))}
                </div>
                <blockquote className="mt-3 leading-[1.9] text-ink">«{t.text}»</blockquote>
                <figcaption className="mt-4 text-sm text-muted">
                  — {t.name}
                  {t.city ? `، ${t.city}` : ""}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Boutique Location & Hours ───────────── */
export function BoutiqueLocationSection({ whatsappHref }: { whatsappHref: string }) {
  const mapUrl = "https://www.google.com/maps?q=32.223977,35.2201582&z=17&hl=en";
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-transparent via-blush/20 to-transparent py-16 md:py-24">
      <div className="container-lux">
        <Reveal className="text-center">
          <SectionHeading eyebrow="Visit Our Boutique" title="موقع المحل وأوقات الدوام" />
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted sm:text-base">
            نسعد بزيارتكِ وتجربة أحدث تشكيلات فيترينا بوتيك على أرض الواقع
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-12 md:items-stretch">
          {/* Working Hours Card */}
          <Reveal delay={0.08} className="md:col-span-6">
            <div className="flex h-full flex-col justify-between rounded-[28px] border border-line bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-2xl bg-blush text-burgundy">
                      <Clock className="size-6" />
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-burgundy">أوقات العمل والاستقبال</h3>
                      <p className="text-xs text-muted">جدول استقبال الزبونات في المحل</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    خدمة متواصلة
                  </span>
                </div>

                <div className="mt-7 space-y-3.5">
                  {/* Specific Days */}
                  <div className="rounded-2xl border border-line/80 bg-blush/30 p-4 transition-colors hover:border-dusty">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-burgundy" />
                        <span className="font-semibold text-burgundy">الأحد · الإثنين · الأربعاء</span>
                      </div>
                      <span className="rounded-full bg-burgundy px-3 py-1 text-xs font-bold text-ivory">
                        3:00 عصراً – 8:00 مساءً
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      الفترة المسائية المخصصة لاستقبال الزبونات وتجربة القطع والمقاسات
                    </p>
                  </div>

                  {/* Other Days */}
                  <div className="rounded-2xl border border-line/80 bg-ivory p-4 transition-colors hover:border-dusty">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-gold" />
                        <span className="font-semibold text-burgundy">باقي الأيام (السبت، الثلاثاء، الخميس، الجمعة)</span>
                      </div>
                      <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold ring-1 ring-gold/30">
                        جميع الأوقات
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      متاح في جميع الأوقات واستقبال الاستفسارات والطلبات على مدار الساعة
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-5">
                <span className="text-xs text-muted">أهلاً وسهلاً بكِ في أي وقت</span>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-burgundy transition hover:text-mauve"
                >
                  <WhatsAppIcon className="size-4" />
                  تأكيد موعد الزيارة عبر واتساب ←
                </a>
              </div>
            </div>
          </Reveal>

          {/* Location & Map Card */}
          <Reveal delay={0.16} className="md:col-span-6">
            <div className="flex h-full flex-col justify-between rounded-[28px] border border-line bg-gradient-to-br from-white via-white to-blush/20 p-6 shadow-[var(--shadow-soft)] sm:p-8">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-2xl bg-burgundy text-ivory">
                      <MapPin className="size-6" />
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-burgundy">موقع المحل</h3>
                      <p className="text-xs text-muted">فلسطين · إحداثيات: 32°13'26.3"N 35°13'12.6"E</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-inner">
                  <div className="relative aspect-[16/9] w-full bg-blush">
                    <iframe
                      title="موقع فيترينا بوتيك على خرائط Google"
                      src="https://maps.google.com/maps?q=32.223977,35.2201582&hl=ar&z=16&output=embed"
                      width="100%"
                      height="100%"
                      loading="lazy"
                      className="border-0"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-muted">انقري لفتح الموقع في تطبيق الخرائط</span>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ size: "md" })}
                >
                  <MapPin className="size-4" />
                  فتح في خرائط Google
                  <ExternalLink className="size-3.5 opacity-70" />
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Social band ───────────── */
export function SocialBand({ instagramUrl, facebookUrl, whatsappHref }: { instagramUrl: string; facebookUrl: string; whatsappHref: string }) {
  const handle = instagramUrl.match(/instagram\.com\/([^/?#]+)/)?.[1];
  return (
    <section className="relative overflow-hidden bg-blush py-16 md:py-24">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border border-dusty" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 size-80 rounded-full border border-dusty/70" />
      <Reveal className="container-lux relative text-center">
        <p className="latin font-display text-sm uppercase tracking-[0.4em] text-mauve">Follow the Vitrine</p>
        <h2 className="mx-auto mt-3 max-w-xl text-3xl font-medium leading-tight text-burgundy md:text-[2.6rem]">شاركينا إطلالتك وتابعي جديدنا أولاً بأول</h2>
        {handle && <p className="latin mt-3 text-lg text-mauve">@{handle}</p>}
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 min-[400px]:flex-row min-[400px]:items-center">
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "lg" })}>
              <InstagramIcon /> تابعينا على إنستغرام
            </a>
          )}
          {facebookUrl && (
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "lg", variant: "secondary" })}>
              <FacebookIcon /> فيسبوك
            </a>
          )}
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "lg", variant: "secondary" })}>
            <WhatsAppIcon /> راسلينا
          </a>
        </div>
      </Reveal>
    </section>
  );
}
