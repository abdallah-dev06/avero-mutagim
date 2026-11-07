import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { getCollections, getNavCategories } from "@/server/catalog";

export const metadata: Metadata = { title: "الأقسام", alternates: { canonical: "/categories" } };

export default async function CategoriesPage() {
  const [categories, collections] = await Promise.all([getNavCategories(), getCollections()]);
  return (
    <div className="container-lux py-10 md:py-14">
      <header className="mb-10 text-center">
        <p className="latin font-display text-xs uppercase tracking-[0.35em] text-mauve">Categories</p>
        <h1 className="mt-2 text-3xl font-medium text-burgundy md:text-5xl">الأقسام</h1>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
        {categories.map((c, i) => (
          <Reveal key={c.id} delay={i * 0.05}>
            <Link href={`/category/${c.slug}`} className="group block">
              <div className="arch relative aspect-[3/4] overflow-hidden bg-blush">
                {c.imageUrl && <Image src={c.imageUrl} alt={c.name} fill sizes="(min-width:1024px) 20vw, 50vw" className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-lux)] group-hover:scale-105" />}
              </div>
              <h2 className="mt-3 text-center text-lg font-medium text-burgundy">{c.name}</h2>
              <p className="text-center text-xs text-muted">{c._count.products} منتج</p>
            </Link>
          </Reveal>
        ))}
      </div>
      {collections.length > 0 && (
        <>
          <h2 className="mb-6 mt-16 text-center text-2xl font-medium text-burgundy">المجموعات</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {collections.map((c) => (
              <Link key={c.id} href={`/collections/${c.slug}`} className="group relative block overflow-hidden rounded-[24px] bg-blush">
                <div className="relative aspect-[16/9]">
                  {c.imageUrl && <Image src={c.imageUrl} alt={c.name} fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-[1.4s] group-hover:scale-105" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-burgundy-900/70 to-transparent" />
                  <div className="absolute bottom-0 p-6 text-ivory">
                    <h3 className="text-2xl font-medium">{c.name}</h3>
                    {c.description && <p className="mt-1 text-sm text-ivory/80">{c.description}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
