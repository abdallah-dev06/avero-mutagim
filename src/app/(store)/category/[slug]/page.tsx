import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogPage, parseListParams } from "@/components/store/catalog-page";
import { prisma } from "@/lib/db";

async function getCategory(slug: string) {
  return prisma.category.findFirst({ where: { slug: decodeURIComponent(slug), isActive: true } });
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const c = await getCategory((await params).slug);
  if (!c) return {};
  return { title: c.name, description: c.description ?? undefined, alternates: { canonical: `/category/${c.slug}` }, openGraph: c.imageUrl ? { images: [c.imageUrl] } : undefined };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();
  return (
    <CatalogPage
      title={category.name}
      eyebrow={category.nameEn ?? undefined}
      description={category.description}
      params={parseListParams(sp, { category: category.slug })}
      basePath={`/category/${category.slug}`}
      searchParams={sp}
    />
  );
}
