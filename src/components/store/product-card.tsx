"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import type { ProductCardData } from "@/server/catalog";
import { discountPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Price } from "@/components/store/price";
import { WishlistButton } from "@/components/store/wishlist-button";

export function ProductCard({ product, wished, priority, sizes = "(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" }: { product: ProductCardData; wished: boolean; priority?: boolean; sizes?: string }) {
  const [preview, setPreview] = React.useState<string | null>(null);
  const off = discountPercent(product);
  const soldOut = product.totalStock <= 0;
  const main = preview ?? product.image?.url ?? null;
  const href = `/product/${product.slug}`;

  return (
    <article className="group relative flex flex-col">
      <Link href={href} className="relative block overflow-hidden rounded-[22px] bg-blush" aria-label={product.name}>
        <div className="relative aspect-[3/4] w-full">
          {main ? (
            <Image
              src={main}
              alt={product.image?.alt ?? product.name}
              fill
              sizes={sizes}
              priority={priority}
              className={cn(
                "object-cover transition-[transform,opacity] duration-[1.2s] ease-[var(--ease-lux)] group-hover:scale-[1.04]",
                soldOut && "opacity-60 grayscale-[35%]",
              )}
            />
          ) : (
            <div className="grid size-full place-items-center text-sm text-muted">لا توجد صورة</div>
          )}
          {!preview && product.hoverImage && product.hoverImage.url !== main && (
            <Image
              src={product.hoverImage.url}
              alt=""
              aria-hidden
              fill
              sizes={sizes}
              className="hidden object-cover opacity-0 transition-opacity duration-700 ease-[var(--ease-lux)] group-hover:opacity-100 md:block"
            />
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex flex-wrap items-start gap-1.5">
          {soldOut ? (
            <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-medium text-white">نفدت الكمية</span>
          ) : (
            <>
              {off > 0 && <span className="latin rounded-full bg-burgundy px-2.5 py-1 text-[11px] font-bold text-ivory">-{off}%</span>}
              {product.isNew && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-burgundy">جديد</span>}
              {product.lowStock && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-danger">كمية محدودة</span>}
            </>
          )}
        </div>
        {product.isDemo && (
          <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-full bg-white/85 px-2 py-0.5 text-[10px] text-muted backdrop-blur">منتج تجريبي</span>
        )}
      </Link>
      <WishlistButton productId={product.id} initial={wished} className="absolute left-2.5 top-2.5 z-10" />

      <div className="mt-3 flex flex-1 flex-col px-0.5">
        {product.category && <p className="text-[11px] tracking-wide text-mauve">{product.category}</p>}
        <h3 className="mt-0.5 line-clamp-2 text-[0.95rem] leading-snug text-ink">
          <Link href={href} className="transition-colors hover:text-burgundy">
            {product.name}
          </Link>
        </h3>
        <Price price={product.price} salePrice={product.salePrice} size="sm" className="mt-1.5" />
        {product.colors.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5" role="list" aria-label="الألوان المتاحة">
            {product.colors.slice(0, 5).map((c) => (
              <button
                key={c.id}
                type="button"
                role="listitem"
                title={c.name + (c.inStock ? "" : " — نفد")}
                aria-label={`معاينة اللون ${c.name}${c.inStock ? "" : " (نفد)"}`}
                onMouseEnter={() => c.image && setPreview(c.image)}
                onMouseLeave={() => setPreview(null)}
                onFocus={() => c.image && setPreview(c.image)}
                onBlur={() => setPreview(null)}
                onClick={() => c.image && setPreview((p) => (p === c.image ? null : c.image))}
                className={cn(
                  "relative size-[22px] rounded-full ring-1 ring-black/10 ring-offset-2 ring-offset-ivory transition hover:ring-mauve",
                  preview === c.image && "ring-2 ring-burgundy",
                  !c.inStock && "opacity-45",
                )}
                style={{ backgroundColor: c.hex }}
              >
                {!c.inStock && <span aria-hidden className="absolute inset-0 m-auto h-px w-full rotate-45 bg-ink/60" />}
              </button>
            ))}
            {product.colors.length > 5 && <span className="text-xs text-muted">+{product.colors.length - 5}</span>}
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, wishlistIds, priorityCount = 0 }: { products: ProductCardData[]; wishlistIds: string[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} wished={wishlistIds.includes(p.id)} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[3/4] rounded-[22px]" />
          <div className="skeleton mt-3 h-3 w-1/3 rounded" />
          <div className="skeleton mt-2 h-4 w-3/4 rounded" />
          <div className="skeleton mt-2 h-4 w-1/4 rounded" />
        </div>
      ))}
    </div>
  );
}
