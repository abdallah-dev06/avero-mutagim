import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { ProductGrid } from "@/components/store/product-card";
import { ProductView, type ProductViewData } from "@/components/store/product-view";
import { SectionHeading } from "@/components/ui/misc";
import { effectivePrice } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/utils";
import { getCart } from "@/server/cart";
import { getProductBySlug, relatedProducts } from "@/server/catalog";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const data = await getProductBySlug(decodeURIComponent((await params).slug));
  if (!data) return { title: "المنتج غير موجود" };
  const p = data.product;
  const image = p.images[0]?.url;
  const description = p.seoDescription || p.description.slice(0, 160);
  return {
    title: p.seoTitle || p.name,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { type: "website", title: p.seoTitle || p.name, description, images: image ? [{ url: image, alt: p.name }] : undefined },
    robots: p.isDemo ? { index: false } : undefined,
  };
}

export default async function ProductPage({ params, searchParams }: PageProps<"/product/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const data = await getProductBySlug(decodeURIComponent(slug));
  if (!data) notFound();
  const { product: p, chart } = data;
  const [settings, cart, related] = await Promise.all([getSettings(), getCart(), relatedProducts(p.id, p.categoryId)]);

  const view: ProductViewData = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    salePrice: p.salePrice,
    description: p.description,
    careInstructions: p.careInstructions,
    isDemo: p.isDemo,
    category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
    colors: p.colors.filter((c) => p.variants.some((v) => v.colorId === c.id)).map((c) => ({ id: c.id, name: c.name, hex: c.hex })),
    images: p.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? p.name, colorId: i.colorId })),
    variants: p.variants.map((v) => ({ id: v.id, colorId: v.colorId, size: v.size, stock: v.stock, priceAdjustment: v.priceAdjustment })),
  };

  const price = effectivePrice(p) / 100;
  const colorName = (id: string) => p.colors.find((c) => c.id === id)?.name ?? "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: p.name,
    description: p.description,
    url: absoluteUrl(`/product/${p.slug}`),
    productGroupID: p.id,
    brand: { "@type": "Brand", name: "VETRINA BOUTIQUE" },
    image: p.images.slice(0, 6).map((i) => absoluteUrl(i.url)),
    variesBy: ["https://schema.org/color", "https://schema.org/size"],
    hasVariant: p.variants.slice(0, 50).map((v) => ({
      "@type": "Product",
      sku: v.sku,
      name: `${p.name} - ${colorName(v.colorId)} - ${v.size}`,
      color: colorName(v.colorId),
      size: v.size,
      offers: {
        "@type": "Offer",
        priceCurrency: "ILS",
        price: (price + v.priceAdjustment / 100).toFixed(2),
        availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: absoluteUrl(`/product/${p.slug}?color=${v.colorId}`),
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: { "@type": "MonetaryAmount", value: settings.shipping.fee / 100, currency: "ILS" },
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "PS" },
        },
      },
    })),
  };

  return (
    <div className="container-lux py-6 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="مسار التنقل" className="mb-5 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-burgundy">
              الرئيسية
            </Link>
          </li>
          <li aria-hidden>/</li>
          {p.category && (
            <>
              <li>
                <Link href={`/category/${p.category.slug}`} className="hover:text-burgundy">
                  {p.category.name}
                </Link>
              </li>
              <li aria-hidden>/</li>
            </>
          )}
          <li aria-current="page" className="line-clamp-1 text-ink">
            {p.name}
          </li>
        </ol>
      </nav>
      <ProductView
        product={view}
        chart={chart ? { name: chart.name, description: chart.description, measurementType: chart.measurementType, rows: chart.rows } : null}
        initialColorId={typeof sp.color === "string" ? sp.color : null}
        wished={cart.wishlistIds.includes(p.id)}
        shippingMessage={settings.shipping.message}
        shippingEstimate={settings.shipping.estimate}
        returnsPolicy={settings.shipping.returnsPolicy}
        whatsappNumber={settings.whatsappButton?.phoneNumber || settings.business.whatsappNumber}
      />
      {related.length > 0 && (
        <section className="mt-20 md:mt-28">
          <Reveal>
            <SectionHeading eyebrow="You may also like" title="قد يعجبك أيضاً" />
          </Reveal>
          <ProductGrid products={related.slice(0, 4)} wishlistIds={cart.wishlistIds} />
        </section>
      )}
    </div>
  );
}
