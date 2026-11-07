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
      <MarqueeBand items={[...settings.announcement.messages, "VETRINA BOUTIQUE"]} />
      <CategoryShowcase categories={categories.filter((c) => c.isFeatured)} />
      <ProductShowcaseGrid eyebrow="New Arrivals" title="وصل حديثاً" href="/shop?sort=new" products={newArrivals} wishlistIds={cart.wishlistIds} />
      <StorySection title={h.storyTitle} text={h.storyText} />
      <ProductRail eyebrow="Best Sellers" title="الأكثر طلباً" href="/shop?sort=best" products={bestSellers} wishlistIds={cart.wishlistIds} />
      <CollectionsSection collections={collections} />
      <Benefits shippingMessage={settings.shipping.message} estimate={settings.shipping.estimate} />
      <Testimonials items={testimonials} />
      <BoutiqueLocationSection whatsappHref={waMeLink(settings.business.whatsappNumber)} />
      <SocialBand instagramUrl={settings.business.instagramUrl} facebookUrl={settings.business.facebookUrl} whatsappHref={waMeLink(settings.business.whatsappNumber)} />
    </>
  );
}
