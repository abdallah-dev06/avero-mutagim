import { Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/admin/admin-shell";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { buttonVariants } from "@/components/ui/button";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { effectivePrice, formatILS } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata = { title: "المنتجات" };

const TABS = [
  { key: "", label: "الكل" },
  { key: "PUBLISHED", label: "منشور" },
  { key: "DRAFT", label: "مسودة" },
  { key: "ARCHIVED", label: "مؤرشف" },
];
const STATUS_LABEL = { PUBLISHED: "منشور", DRAFT: "مسودة", ARCHIVED: "مؤرشف" } as const;

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" && ["PUBLISHED", "DRAFT", "ARCHIVED"].includes(sp.status) ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const cat = typeof sp.category === "string" ? sp.category : "";
  const where: Prisma.ProductWhereInput = {
    ...(status ? { status: status as "PUBLISHED" } : { status: { not: "ARCHIVED" } }),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { variants: { some: { sku: { contains: q, mode: "insensitive" } } } }] } : {}),
    ...(cat ? { categoryId: cat } : {}),
  };
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: {
        category: { select: { name: true } },
        images: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } },
        variants: { select: { stock: true, isActive: true } },
        _count: { select: { colors: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="المنتجات"
        description={`${products.length} منتج`}
        actions={
          <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
            <Plus /> إضافة منتج
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/products${t.key ? `?status=${t.key}` : ""}`} className={cn("rounded-full px-4 py-2 text-sm", status === t.key ? "bg-burgundy text-ivory" : "bg-white ring-1 ring-line")}>
            {t.label}
          </Link>
        ))}
        <form className="flex flex-1 flex-wrap gap-2 sm:justify-end" action="/admin/products">
          {status && <input type="hidden" name="status" value={status} />}
          <select name="category" defaultValue={cat} className="h-10 rounded-xl border border-line bg-white px-3 text-sm" aria-label="القسم">
            <option value="">كل الأقسام</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="relative min-w-48 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder="الاسم أو SKU" aria-label="بحث" className="h-10 w-full rounded-xl border border-line bg-white pe-3 text-[16px] sm:text-sm" style={{ paddingInlineStart: "2.25rem" }} />
          </label>
        </form>
      </div>

      {products.length ? (
        <ul className="grid gap-2">
          {products.map((p) => {
            const stock = p.variants.filter((v) => v.isActive).reduce((s, v) => s + v.stock, 0);
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
                <Link href={`/admin/products/${p.id}`} className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg bg-blush">
                  {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="56px" className="object-cover" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${p.id}`} className="line-clamp-1 font-medium hover:text-burgundy">
                    {p.name}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                    <span>{p.category?.name ?? "بدون قسم"}</span>·<span className="latin">{formatILS(effectivePrice(p))}</span>·<span>{p._count.colors} ألوان</span>·
                    <span className={cn(stock === 0 ? "text-danger" : stock <= 5 ? "text-amber-700" : "")}>المخزون {stock}</span>
                    {p.isDemo && <span className="rounded bg-stone-100 px-1.5">تجريبي</span>}
                  </p>
                </div>
                <span className={cn("hidden rounded-full px-2.5 py-1 text-xs sm:inline", p.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-900" : p.status === "DRAFT" ? "bg-amber-50 text-amber-900" : "bg-stone-100 text-stone-700")}>{STATUS_LABEL[p.status]}</span>
                <ProductRowActions id={p.id} name={p.name} status={p.status} />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-2xl border border-line bg-white p-10 text-center text-muted">لا توجد منتجات.</p>
      )}
    </div>
  );
}
