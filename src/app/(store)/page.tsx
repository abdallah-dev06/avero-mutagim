import { Hero } from "@/components/store/home/hero";
import {
  Benefits,
  BoutiqueLocationSection,
  CategoryShowcase,
  CollectionsSection,
  MarqueeBand,
  ProductRail,
  ProductShowcaseGrid,
  SocialBand,
  StorySection,
  Testimonials,
} from "@/components/store/home/sections";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/utils";
import { waMeLink } from "@/lib/whatsapp";
import { getCart } from "@/server/cart";
import { getCollections, getNavCategories, productCards } from "@/server/catalog";

export default async function HomePage() {
  const settings = await getSettings();
  const h = settings.homepage;
  const [categories, collections, newArrivals, bestSellers, testimonials, cart] = await Promise.all([
    getNavCategories(),
    h.showCollections ? getCollections() : Promise.resolve([]),
    h.showNewArrivals ? productCards({}, [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }], 8) : Promise.resolve([]),
    h.showBestSellers ? productCards({}, [{ soldCount: "desc" }, { isBestSeller: "desc" }, { isFeatured: "desc" }], 10) : Promise.resolve([]),
    h.showTestimonials ? prisma.testimonial.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 6 }) : Promise.resolve([]),
    getCart(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: settings.business.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/logo.webp"),
    image: absoluteUrl("/brand/og.jpg"),
    telephone: settings.business.whatsappNumber || undefined,
    address: { "@type": "PostalAddress", addressCountry: "PS" },
    sameAs: [settings.business.instagramUrl, settings.business.facebookUrl].filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero hero={settings.hero} />
      <MarqueeBand items={[...settings.announcement.messages, "AVERO MUTAGIM"]} />
      {categories.length === 0 && newArrivals.length === 0 && (
        <section className="py-12 md:py-16">
          <div className="container-lux text-center">
            <div className="mx-auto max-w-2xl rounded-[32px] border border-gold/40 bg-gradient-to-br from-ivory via-white to-blush p-8 md:p-12 shadow-[var(--shadow-soft)]">
              <span className="latin font-display text-xs font-semibold tracking-[0.3em] text-mauve uppercase">
                AVERO MUTAGIM • MEN&apos;S LUXURY FASHION
              </span>
              <h2 className="mt-4 text-2xl font-bold text-burgundy sm:text-3xl md:text-4xl">
                التشكيلة الجديدة قيد الإعداد
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
                نعمل حالياً على تجهيز وإضافة أحدث تشكيلات الأزياء والبدل والقمصان الإيطالية الراقية للمتجر. يسعدنا استقبالكم في فرعنا أو التواصل المباشر عبر واتساب للاطلاع على المتوفر وتجهيز طلبكم فوراً.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={waMeLink(settings.business.whatsappNumber, "مرحباً AVERO MUTAGIM 👑، أود الاستفسار عن التشكيلة المتوفرة لديكم.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-burgundy px-7 py-3 text-sm font-bold text-ivory shadow-md transition hover:bg-burgundy-900"
                >
                  تواصل عبر واتساب
                </a>
                <a
                  href="#location"
                  className="inline-flex items-center gap-2 rounded-full border border-burgundy/30 bg-transparent px-7 py-3 text-sm font-bold text-burgundy transition hover:bg-blush"
                >
                  موقع الفرع
                </a>
              </div>
            </div>
          </div>
        </section>
      )}
      <CategoryShowcase categories={categories.filter((c) => c.isFeatured)} />
      <ProductShowcaseGrid eyebrow="New Arrivals" title="وصل حديثاً" href="/shop?sort=new" products={newArrivals} wishlistIds={cart.wishlistIds} />
      {h.showStory !== false && (settings.story?.enabled ?? true) && (
        <StorySection
          title={settings.story?.title || h.storyTitle}
          text={settings.story?.homeIntro || h.storyText}
          eyebrow={settings.story?.eyebrow || "OUR STORY"}
          imageUrl={settings.story?.imageUrl}
          imageAlt={settings.story?.imageAlt}
        />
      )}
      <ProductRail eyebrow="Best Sellers" title="الأكثر طلباً" href="/shop?sort=best" products={bestSellers} wishlistIds={cart.wishlistIds} />
      <CollectionsSection collections={collections} />
      <Benefits shippingMessage={settings.shipping.message} estimate={settings.shipping.estimate} />
      <Testimonials items={testimonials} />
      {h.showLocation !== false && (
        <BoutiqueLocationSection whatsappHref={waMeLink(settings.business.whatsappNumber)} />
      )}
      <SocialBand instagramUrl={settings.business.instagramUrl} facebookUrl={settings.business.facebookUrl} whatsappHref={waMeLink(settings.business.whatsappNumber)} />
    </>
  );
}
