import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogPage, parseListParams } from "@/components/store/catalog-page";
import { prisma } from "@/lib/db";

async function getCollection(slug: string) {
  return prisma.collection.findFirst({ where: { slug: decodeURIComponent(slug), isActive: true } });
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const c = await getCollection((await params).slug);
  if (!c) return {};
  return { title: c.name, description: c.description ?? undefined, alternates: { canonical: `/collections/${c.slug}` } };
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/collections/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const collection = await getCollection(slug);
  if (!collection) notFound();
  return (
    <CatalogPage
      title={collection.name}
      eyebrow={collection.nameEn ?? "Collection"}
      description={collection.description}
      params={parseListParams(sp, { collection: collection.slug })}
      basePath={`/collections/${collection.slug}`}
      searchParams={sp}
    />
  );
}
