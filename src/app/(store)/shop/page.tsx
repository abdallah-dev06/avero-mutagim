import type { Metadata } from "next";
import { CatalogPage, parseListParams } from "@/components/store/catalog-page";

export async function generateMetadata({ searchParams }: PageProps<"/shop">): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : null;
  return { title: q ? `نتائج البحث: ${q}` : "تسوّقي كل المنتجات", alternates: { canonical: "/shop" }, robots: q ? { index: false } : undefined };
}

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const params = parseListParams(sp);
  const title = params.q ? `نتائج البحث عن «${params.q}»` : params.sort === "best" ? "الأكثر مبيعاً" : params.sort === "new" && sp.sort ? "وصل حديثاً" : "كل المنتجات";
  return <CatalogPage title={title} eyebrow="The Boutique" params={params} basePath="/shop" searchParams={sp} />;
}
