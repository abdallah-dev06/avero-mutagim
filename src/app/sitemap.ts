import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, collections] = await Promise.all([
    prisma.product.findMany({ where: { status: "PUBLISHED", isDemo: false }, select: { slug: true, updatedAt: true, images: { take: 1, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], select: { url: true } } } }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.collection.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/shop"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/categories"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/policies"), changeFrequency: "monthly", priority: 0.3 },
    ...categories.map((c) => ({ url: absoluteUrl(`/category/${c.slug}`), lastModified: c.updatedAt, priority: 0.8 })),
    ...collections.map((c) => ({ url: absoluteUrl(`/collections/${c.slug}`), lastModified: c.updatedAt, priority: 0.7 })),
    ...products.map((p) => ({ url: absoluteUrl(`/product/${p.slug}`), lastModified: p.updatedAt, priority: 0.8, images: p.images.map((i) => absoluteUrl(i.url)) })),
  ];
}
