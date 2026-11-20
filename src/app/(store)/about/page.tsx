import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Feather, HeartHandshake, ShieldCheck, Truck } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "قصتنا | Our Story",
  description:
    "حكاية AVERO MUTAGIM: علامة تجارية رائدة في عالم الأزياء الرجالية والشبابية تجمع بين الأناقة الكلاسيكية والعصرية، لنقدم أرقى التصاميم والبدل والقمصان والإكسسوارات للرجل العصري.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const settings = await getSettings();
  const story = settings.story;

  const headline = story?.title || "الفخامة والأناقة بأسلوبك العصري";
  const subheading = story?.subtitle || "العلامات التجارية • الجودة • الأسلوب";
  const heroImage = story?.imageUrl || "/brand/og.jpg";

  const paragraphs = (story?.fullStory || "")
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const brandValues = [
    {
      title: "أناقة تعكس حضورك",
      desc: "نختار أرقى التصاميم الرجالية والشبابية التي تمنحك حضوراً واثقاً ومميزاً في كل مناسبة وإطلالة يومية.",
      badge: "تصاميم منتقاة",
    },
    {
      title: "أصالة وجودة العلامات",
      desc: "نعتمد أشهر العلامات التجارية وأجود الخامات العالمية من أقمشة وخياطة وتشطيبات استثنائية تدوم.",
      badge: "جودة معتمدة",
    },
    {
      title: "شحن وتوصيل لجميع البلدان",
      desc: "طلب سهل، دفع نقدي آمن عند الاستلام، وتوصيل سريع وموثوق إلى جميع أنحاء البلاد وكافة البلدان.",
      badge: "خدمة شاملة",
    },
  ];

  return (
    <div className="relative overflow-hidden bg-ivory">
      {/* ───────────── Top Hero Banner ───────────── */}
      <section className="relative overflow-hidden border-b border-line/60 bg-gradient-to-b from-blush/40 via-ivory to-ivory py-16 sm:py-20 md:py-28">
        {/* Subtle Luxury Rings in background */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-28 -top-28 size-96 rounded-full border border-gold/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-10 size-[32rem] rounded-full border border-burgundy/5"
        />

        <div className="container-lux relative text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/70 px-4 py-1.5 shadow-sm backdrop-blur-sm">
              <span className="size-2 rounded-full bg-gold shadow-[0_0_6px_rgba(212,175,55,0.7)]" />
              <span className="latin font-display text-xs uppercase tracking-[0.3em] text-burgundy">
                AVERO MUTAGIM — OUR STORY
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-medium leading-[1.25] tracking-tight text-burgundy sm:text-5xl md:text-6xl">
              {headline}
            </h1>
          </Reveal>

          <Reveal delay={0.18}>
            <p className="mx-auto mt-4 max-w-xl text-base font-semibold text-mauve sm:text-lg">
              {subheading}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────────── Main Story Narrative ───────────── */}
      <section className="py-14 sm:py-20 md:py-24">
        <div className="container-lux">
          <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Visual Column: Editorial Arched Photograph */}
            <Reveal className="lg:col-span-5">
              <div className="sticky top-28 mx-auto max-w-md lg:max-w-none">
                <div className="arch relative aspect-[3/4] w-full overflow-hidden rounded-t-[140px] rounded-b-[32px] border border-gold/30 bg-blush shadow-[0_20px_50px_rgba(75,31,52,0.15)] ring-1 ring-burgundy/10">
                  <Image
                    src={heroImage}
                    alt={story?.imageAlt || "قصتنا - فيترينا بوتيك"}
                    fill
                    priority
                    sizes="(min-width: 1024px) 38vw, 90vw"
                    className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-lux)] hover:scale-105"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-burgundy/60 via-transparent to-transparent"
                  />

                  {/* Editorial Seal */}
                  <div className="absolute bottom-6 inset-x-6 rounded-2xl border border-white/25 bg-black/45 p-4 text-center text-ivory backdrop-blur-md">
                    <p className="latin font-display text-xs tracking-[0.35em] text-gold uppercase">
                      AVERO MUTAGIM
                    </p>
                    <p className="mt-1 text-xs text-ivory/90">
                      العلامات التجارية • الجودة • الأسلوب
                    </p>
                  </div>
                </div>

                {/* Decorative border frame */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-4 -left-4 size-32 rounded-3xl border border-gold/20 -z-10 hidden sm:block"
                />
              </div>
            </Reveal>

            {/* Narrative Column: Full Story Paragraphs */}
            <Reveal delay={0.12} className="lg:col-span-7">
              <div className="space-y-6 sm:space-y-8">
                {paragraphs.map((p, idx) => {
                  const isFirst = idx === 0;
                  const isCallout = p.includes("توصيل") || p.includes("شحن");

                  if (isCallout) {
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-gold/30 bg-gradient-to-r from-blush/60 via-white to-blush/40 p-5 shadow-sm sm:p-7"
                      >
                        <div className="flex items-start gap-3.5">
                          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-burgundy text-gold shadow-sm">
                            <Truck className="size-5" />
                          </span>
                          <div>
                            <span className="inline-block text-xs font-bold text-burgundy">
                              خدمة التوصيل الشاملة
                            </span>
                            <p className="mt-1 text-base leading-relaxed text-ink/90 sm:text-lg">
                              {p}
                            </p>
                            <p className="mt-2 text-xs text-muted">
                              شحن سريع وموثوق إلى جميع أنحاء البلاد ولكافة البلدان والدفع نقداً عند الاستلام.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="relative">
                      {isFirst && (
                        <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mauve">
                          <span className="size-1.5 rounded-full bg-gold" />
                          رؤيتنا وشغفنا
                        </div>
                      )}
                      <p
                        className={cn(
                          "leading-[2.1] text-ink sm:leading-[2.2]",
                          isFirst
                            ? "text-lg font-medium text-burgundy sm:text-xl sm:leading-[2.2]"
                            : "text-base text-ink/85 sm:text-lg"
                        )}
                      >
                        {p}
                      </p>
                    </div>
                  );
                })}

                {/* Closing signature */}
                <div className="border-t border-line/80 pt-8 mt-10">
                  <div className="rounded-2xl border border-gold/30 bg-white p-6 text-center shadow-[var(--shadow-soft)] sm:p-8">
                    <span className="latin font-display text-2xl tracking-[0.25em] text-burgundy sm:text-3xl">
                      AVERO MUTAGIM
                    </span>
                    <p className="mt-3 text-base font-semibold text-gold sm:text-lg">
                      {story?.quote || "العلامات التجارية • الجودة • الأسلوب."}
                    </p>
                    <div className="mx-auto mt-4 h-0.5 w-16 bg-gradient-to-r from-transparent via-gold to-transparent" />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────── Brand Values ───────────── */}
      <section className="border-y border-line/70 bg-white/70 py-16 md:py-24">
        <div className="container-lux">
          <Reveal className="text-center">
            <span className="latin font-display text-xs uppercase tracking-[0.35em] text-mauve">
              OUR PROMISE
            </span>
            <h2 className="mt-2 text-2xl font-medium text-burgundy sm:text-3xl md:text-4xl">
              قيمٌ نعتز بها في كل قطعة
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
              نضع معايير عالية لنضمن لكِ تجربة استثنائية من الاختيار حتى الوصول
            </p>
          </Reveal>

          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {brandValues.map((v, i) => (
              <StaggerItem key={v.title}>
                <div className="group relative flex h-full flex-col justify-between rounded-3xl border border-line bg-white p-7 shadow-sm transition-all duration-300 hover:border-gold/50 hover:shadow-md">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="grid size-12 place-items-center rounded-2xl bg-blush text-burgundy transition-colors group-hover:bg-burgundy group-hover:text-gold">
                        <CheckCircle2 className="size-5" />
                      </span>
                      <span className="rounded-full bg-blush/80 px-3 py-1 text-[11px] font-semibold text-burgundy">
                        {v.badge}
                      </span>
                    </div>

                    <h3 className="mt-5 text-xl font-bold text-burgundy">
                      {v.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted sm:text-base">
                      {v.desc}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-gold">
                    <span className="size-1.5 rounded-full bg-gold" />
                    <span>معايير فيترينا</span>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ───────────── Grand CTA Section ───────────── */}
      <section className="relative overflow-hidden bg-burgundy py-20 text-ivory md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-0 size-80 rounded-full border border-gold/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 bottom-0 size-80 rounded-full border border-gold/15"
        />

        <div className="container-lux relative text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-ivory/10 px-4 py-1.5 text-xs text-dusty">
              <span className="size-1.5 rounded-full bg-gold" />
              تشكيلة مختارة بعناية
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="mt-5 text-3xl font-medium tracking-tight text-ivory sm:text-4xl md:text-5xl">
              إطلالتكِ القادمة بانتظاركِ
            </h2>
          </Reveal>

          <Reveal delay={0.18}>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ivory/80 sm:text-base">
              اكتشفي تشكيلة العبايات، البلايز، الأطقم والشالات المصممة لتمنحكِ أسلوباً يشبهكِ بكل فخامة وبساطة.
            </p>
          </Reveal>

          <Reveal delay={0.25}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/shop"
                className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#f3e5ab] via-[#dfb652] to-[#b88a6a] px-8 py-4 text-base font-bold text-burgundy-950 shadow-[0_8px_30px_rgba(212,175,55,0.35)] transition-all hover:brightness-105 active:scale-[0.98]"
              >
                <span>تسوّقي الآن</span>
                <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
              </Link>

              <Link
                href="/categories"
                className="inline-flex items-center gap-2 rounded-full border border-ivory/30 bg-transparent px-7 py-4 text-sm font-medium text-ivory transition hover:border-ivory hover:bg-ivory/10"
              >
                استكشفي الأقسام
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
