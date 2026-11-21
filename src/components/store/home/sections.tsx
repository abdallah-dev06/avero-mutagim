"use client";

import { ArrowLeft, ArrowRight, Banknote, Calendar, Clock, ExternalLink, Gem, MapPin, RefreshCcw, Truck } from "lucide-react";
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
            <span className="inline-block size-1.5 rounded-full bg-gold/90 shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
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
            title="تشكيلات حسب الأقسام"
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

/* ───────────── Story (Editorial Luxury Preview) ───────────── */
export function StorySection({
  title = "الفخامة والأناقة بأسلوبك العصري",
  text = "في AVERO MUTAGIM، نؤمن بأن الأناقة تعكس شخصية الرجل العصري وحضوره المميز. نحرص على انتقاء أرقى الخامات وأحدث صيحات الموضة من أشهر العلامات التجارية لنقدم لك تجربة أزياء استثنائية.",
  eyebrow = "OUR STORY",
  imageUrl = null,
  imageAlt = "AVERO MUTAGIM",
}: {
  title?: string;
  text?: string;
  eyebrow?: string;
  imageUrl?: string | null;
  imageAlt?: string;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yParallax = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [30, -30]);
  const ringRotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);

  const displayImage = imageUrl || "/brand/og.jpg";

  return (
    <section
      ref={ref}
      aria-labelledby="story-heading"
      className="relative overflow-hidden bg-gradient-to-b from-[#06281f] via-[#0b4d3b] to-[#041d16] py-20 text-ivory md:py-32"
    >
      {/* Decorative Golden Concentric Rings */}
      <motion.div
        aria-hidden
        style={{ rotate: ringRotate }}
        className="pointer-events-none absolute -left-36 top-1/2 size-[32rem] -translate-y-1/2 rounded-full border border-gold/20 md:size-[46rem]"
      >
        <span className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/80 shadow-[0_0_12px_rgba(212,175,55,0.6)]" />
      </motion.div>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-10 size-72 rounded-full bg-mauve/10 blur-3xl"
      />

      <div className="container-lux relative">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Editorial Visual Column */}
          <Reveal className="order-2 lg:order-1 lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer arch frame with golden stroke */}
              <div className="arch relative aspect-[3/4] overflow-hidden rounded-t-[120px] rounded-b-[32px] border border-gold/30 bg-blush/20 shadow-[0_20px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/10 sm:rounded-t-[140px]">
                <motion.div style={{ y: yParallax }} className="relative h-[115%] w-full -top-[7%]">
                  <Image
                    src={displayImage}
                    alt={imageAlt || title}
                    fill
                    sizes="(min-width: 1024px) 38vw, 85vw"
                    className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-lux)] hover:scale-105"
                  />
                </motion.div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#041d16]/80 via-transparent to-transparent"
                />

                {/* Subtle Floating Label */}
                <div className="absolute bottom-5 inset-x-5 flex items-center justify-between rounded-2xl border border-white/15 bg-black/40 px-4 py-2.5 backdrop-blur-md">
                  <span className="latin font-display text-xs uppercase tracking-[0.25em] text-ivory font-semibold">
                    AVERO MUTAGIM
                  </span>
                  <span className="inline-block size-1.5 rounded-full bg-gold/90" />
                  <span className="text-[11px] text-dusty">إصدارات مختارة</span>
                </div>
              </div>

              {/* Decorative side accent lines */}
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-4 -right-4 size-28 rounded-3xl border border-gold/25 -z-10"
              />
            </div>
          </Reveal>

          {/* Narrative Column */}
          <Reveal delay={0.12} className="order-1 lg:order-2 lg:col-span-7">
            <div className="max-w-xl text-start">
              {/* Eyebrow */}
              <div className="flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-gold/90 shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                <p className="latin font-display text-xs uppercase tracking-[0.35em] text-dusty">
                  {eyebrow}
                </p>
                <span className="h-px w-10 bg-gold/30" />
              </div>

              {/* Main Heading */}
              <h2
                id="story-heading"
                className="mt-4 text-3xl font-medium leading-[1.25] tracking-tight text-ivory sm:text-4xl lg:text-5xl"
              >
                {title}
              </h2>

              <p className="mt-3 text-sm font-semibold tracking-wide text-dusty sm:text-base">
                لأن الأناقة تبدأ من التفاصيل...
              </p>

              {/* Emotional Introduction */}
              <p className="mt-6 text-base leading-[2.1] text-ivory/85 sm:text-lg sm:leading-[2.2]">
                {text}
              </p>

              {/* Minimal Brand Highlights */}
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                <div>
                  <span className="block text-xs font-semibold text-dusty">فخامة هادئة</span>
                  <p className="mt-1 text-xs text-ivory/70">قصّات مريحة تدوم أكثر من موسم</p>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-dusty">عناية بكل قطعة</span>
                  <p className="mt-1 text-xs text-ivory/70">أقمشة مختارة وفحص يدوي دقيق</p>
                </div>
              </div>

              {/* CTA button to /about */}
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-2.5 rounded-full border border-gold/40 bg-gradient-to-r from-gold/15 via-gold/10 to-transparent px-7 py-3.5 text-sm font-bold text-ivory shadow-[0_4px_20px_rgba(212,175,55,0.15)] transition-all hover:border-gold hover:bg-gold hover:text-burgundy-950 active:scale-[0.98]"
                >
                  <span>اكتشف حكايتنا</span>
                  <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
                </Link>

                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 text-sm text-ivory/70 transition-colors hover:text-ivory"
                >
                  <span>تصفّح الكتالوج</span>
                  <span className="text-xs text-dusty">←</span>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
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
                    استكشف المجموعة <ArrowLeft className="size-4 transition-transform duration-500 group-hover:-translate-x-1" />
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
    { icon: Banknote, title: "الدفع عند الاستلام", text: "ادفع نقداً عند استلام طلبك بكل راحة وأمان." },
    { icon: RefreshCcw, title: "استبدال سهل وموثوق", text: "تواصل معنا مباشرة عبر واتساب لترتيب أي استبدال." },
    { icon: Gem, title: "أصالة وجودة العلامات", text: "أرقى الماركات والخامات مفحوصة بدقة لضمان أعلى المعايير." },
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
          <SectionHeading
            eyebrow="Kind Words"
            title="آراء وتجارب عملائنا المميزين 👑"
            action={
              <Link href="/reviews" className="group inline-flex items-center gap-1.5 text-sm font-bold text-burgundy">
                كل الآراء <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              </Link>
            }
          />
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

        <Reveal delay={0.2} className="mt-10 text-center">
          <p className="latin font-display text-xs tracking-[0.25em] text-mauve uppercase font-bold">
            AVERO MUTAGIM
          </p>
          <p className="mt-1 text-sm sm:text-base font-semibold text-burgundy">
            ثقتكم بنا سر تميزنا وأناقتكم غايتنا 👑
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────── Boutique Location & Hours ───────────── */
export function BoutiqueLocationSection({ whatsappHref }: { whatsappHref: string }) {
  const mapUrl = "https://www.google.com/maps?q=32.223977,35.2201582&z=17&hl=en";
  return (
    <section id="location" className="relative overflow-hidden bg-gradient-to-b from-transparent via-blush/20 to-transparent py-16 md:py-24">
      <div className="container-lux">
        <Reveal className="text-center">
          <SectionHeading eyebrow="Visit AVERO MUTAGIM" title="موقع الفرع وأوقات الدوام" />
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted sm:text-base">
            نسعد بزيارتكم واستكشاف أحدث تشكيلات AVERO MUTAGIM الفاخرة على أرض الواقع
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
                      <p className="text-xs text-muted">جدول استقبال عملائنا في الفرع</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    خدمة متواصلة
                  </span>
                </div>

                <div className="mt-7 space-y-3.5">
                  {/* Working Days */}
                  <div className="rounded-2xl border border-line/80 bg-blush/30 p-4 transition-colors hover:border-dusty">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-burgundy" />
                        <span className="font-semibold text-burgundy">الأحد – الخميس</span>
                      </div>
                      <span className="rounded-full bg-burgundy px-3 py-1 text-xs font-bold text-ivory">
                        10:00 صباحاً – 10:00 مساءً
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      استقبال العملاء وتجربة أرقى المجموعات والبدل والقمصان
                    </p>
                  </div>

                  {/* Shipping Info */}
                  <div className="rounded-2xl border border-line/80 bg-ivory p-4 transition-colors hover:border-dusty">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block size-2 rounded-full bg-gold shadow-[0_0_6px_rgba(212,175,55,0.6)]" />
                        <span className="font-semibold text-burgundy">خدمة الشحن والتوصيل</span>
                      </div>
                      <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold ring-1 ring-gold/30">
                        شحن لجميع البلدان
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      شحن وتوصيل سريع وموثوق إلى جميع أنحاء البلاد وكافة البلدان والدفع عند الاستلام
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-5">
                <span className="text-xs text-muted">أهلاً وسهلاً بكم في أي وقت</span>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-burgundy transition hover:text-mauve"
                >
                  <WhatsAppIcon className="size-4" />
                  تواصل معنا مباشرة عبر واتساب ←
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
                      <h3 className="text-xl font-bold text-burgundy">موقع الفرع</h3>
                      <p className="text-xs text-muted font-medium">بيان - دير الأسد | البعنة - دير الأسد</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-inner">
                  <div className="relative aspect-[16/9] w-full bg-blush">
                    <iframe
                      title="موقع AVERO MUTAGIM على خرائط Google"
                      src="https://maps.google.com/maps?q=32.9300,35.2600&hl=ar&z=15&output=embed"
                      width="100%"
                      height="100%"
                      loading="lazy"
                      className="border-0"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-muted">📍 بيان - دير الأسد | البعنة</span>
                <a
                  href="https://www.google.com/maps?q=Deir+al-Asad&hl=ar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ size: "md" })}
                >
                  <MapPin className="size-4" />
                  فتح الموقع على الخريطة
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
  const handle = instagramUrl.match(/instagram\.com\/([^/?#]+)/)?.[1] || "avero_mutagim";
  return (
    <section className="relative overflow-hidden bg-blush py-16 md:py-24">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border border-dusty" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 size-80 rounded-full border border-dusty/70" />
      <Reveal className="container-lux relative text-center">
        <p className="latin font-display text-sm uppercase tracking-[0.4em] text-mauve">AVERO MUTAGIM</p>
        <h2 className="mx-auto mt-3 max-w-xl text-3xl font-medium leading-tight text-burgundy md:text-[2.6rem]">شاركنا إطلالتك وتابع جديدنا أولاً بأول</h2>
        {handle && <p className="latin mt-3 text-lg font-semibold text-mauve">@{handle}</p>}
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 min-[400px]:flex-row min-[400px]:items-center">
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "lg" })}>
              <InstagramIcon /> تابعنا على إنستغرام
            </a>
          )}
          {facebookUrl && (
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "lg", variant: "secondary" })}>
              <FacebookIcon /> فيسبوك
            </a>
          )}
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "lg", variant: "secondary" })}>
            <WhatsAppIcon /> تواصل معنا عبر واتساب
          </a>
        </div>
      </Reveal>
    </section>
  );
}

