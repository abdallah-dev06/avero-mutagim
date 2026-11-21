import { SearchX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ActiveFilters, FiltersSheetButton, FiltersSidebar, SortSelect } from "@/components/store/catalog-filters";
import { ProductGrid } from "@/components/store/product-card";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { getCart } from "@/server/cart";
import { getFacets, listProducts, type ListParams } from "@/server/catalog";

type SP = Record<string, string | string[] | undefined>;

const arr = (v: string | string[] | undefined) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | string[] | undefined) => {
  const n = Number(one(v));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export function parseListParams(sp: SP, base: Partial<ListParams> = {}): ListParams {
  const sort = one(sp.sort);
  return {
    ...base,
    q: one(sp.q)?.slice(0, 80) || undefined,
    sizes: arr(sp.size).slice(0, 12),
    colors: arr(sp.color).slice(0, 12),
    min: num(sp.min),
    max: num(sp.max),
    available: one(sp.available) === "1",
    sale: one(sp.sale) === "1",
    sort: (["new", "price-asc", "price-desc", "best", "featured"] as const).find((s) => s === sort) ?? "new",
    page: Math.min(200, Math.max(1, Number(one(sp.page)) || 1)),
  };
}

export async function CatalogPage({
  title,
  eyebrow,
  description,
  params,
  basePath,
  searchParams,
}: {
  title: string;
  eyebrow?: string;
  description?: string | null;
  params: ListParams;
  basePath: string;
  searchParams: SP;
}) {
  const [{ products, total, page, pages }, facets, cart] = await Promise.all([listProducts(params), getFacets(), getCart()]);
  const pageHref = (p: number) => {
    const qs = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => arr(v).forEach((x) => k !== "page" && qs.append(k, x)));
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="container-lux py-8 md:py-12">
      <header className="mb-8 border-b border-line pb-8 text-center md:mb-10">
        {eyebrow && <p className="latin font-display text-xs uppercase tracking-[0.35em] text-mauve">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-medium text-burgundy md:text-5xl">{title}</h1>
        {description && <p className="mx-auto mt-3 max-w-xl leading-relaxed text-muted">{description}</p>}
      </header>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <Suspense>
          <FiltersSidebar facets={facets} />
        </Suspense>
        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">
              {total} منتج
            </p>
            <div className="flex items-center gap-2">
              <Suspense>
                <FiltersSheetButton facets={facets} count={total} />
                <SortSelect />
              </Suspense>
            </div>
          </div>
          <div className="mb-6">
            <Suspense>
              <ActiveFilters />
            </Suspense>
          </div>
          {products.length ? (
            <>
              <ProductGrid products={products} wishlistIds={cart.wishlistIds} priorityCount={4} />
              {pages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-2" aria-label="الصفحات">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={pageHref(p)}
                      aria-current={p === page ? "page" : undefined}
                      className={p === page ? "grid size-11 place-items-center rounded-full bg-burgundy text-ivory" : "grid size-11 place-items-center rounded-full border border-line text-ink hover:border-burgundy"}
                    >
                      {p}
                    </Link>
                  ))}
                </nav>
              )}
            </>
          ) : (
            <EmptyState
              icon={<SearchX />}
              title="لا توجد منتجات مطابقة"
              description="جرّب تعديل الفلاتر أو البحث بكلمة أخرى."
              action={
                <Link href={basePath} className={buttonVariants({ variant: "secondary" })}>
                  مسح الفلاتر
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
