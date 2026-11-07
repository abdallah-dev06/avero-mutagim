import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { sortSizes } from "@/lib/sizes";

export const PAGE_SIZE = 24;

const cardInclude = {
  images: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], select: { url: true, alt: true, colorId: true, width: true, height: true } },
  colors: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, hex: true } },
  variants: { where: { isActive: true }, select: { colorId: true, size: true, stock: true } },
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  isDemo: boolean;
  isNew: boolean;
  category: string | null;
  image: { url: string; alt: string } | null;
  hoverImage: { url: string; alt: string } | null;
  colors: { id: string; name: string; hex: string; image: string | null; inStock: boolean }[];
  sizes: string[];
  totalStock: number;
  lowStock: boolean;
};

function toCard(p: CardRow): ProductCardData {
  const cover = p.images[0] ?? null;
  const hover = p.images.find((i) => i.url !== cover?.url && (!cover?.colorId || i.colorId === cover.colorId)) ?? p.images[1] ?? null;
  const total = p.variants.reduce((s, v) => s + Math.max(0, v.stock), 0);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    salePrice: p.salePrice,
    isDemo: p.isDemo,
    isNew: !!p.publishedAt && Date.now() - p.publishedAt.getTime() < 21 * 864e5,
    category: p.category?.name ?? null,
    image: cover ? { url: cover.url, alt: cover.alt ?? p.name } : null,
    hoverImage: hover ? { url: hover.url, alt: hover.alt ?? p.name } : null,
    colors: p.colors.filter((c) => p.variants.some((v) => v.colorId === c.id)).map((c) => ({
      id: c.id,
      name: c.name,
      hex: c.hex,
      image: p.images.find((i) => i.colorId === c.id)?.url ?? null,
      inStock: p.variants.some((v) => v.colorId === c.id && v.stock > 0),
    })),
    sizes: sortSizes([...new Set(p.variants.filter((v) => v.stock > 0).map((v) => v.size))]),
    totalStock: total,
    lowStock: total > 0 && total <= 3,
  };
}

const published: Prisma.ProductWhereInput = { status: "PUBLISHED" };

export type ListParams = {
  q?: string;
  category?: string;
  collection?: string;
  sizes?: string[];
  colors?: string[];
  min?: number; // ILS
  max?: number; // ILS
  available?: boolean;
  sale?: boolean;
  sort?: "new" | "price-asc" | "price-desc" | "best" | "featured";
  page?: number;
};

export function buildWhere(p: ListParams): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [published];
  if (p.q) {
    const q = p.q.trim().slice(0, 80);
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        { colors: { some: { name: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }
  if (p.category) and.push({ category: { slug: p.category, isActive: true } });
  if (p.collection) and.push({ collections: { some: { slug: p.collection, isActive: true } } });
  const variantFilter: Prisma.ProductVariantWhereInput = { isActive: true };
  let useVariant = false;
  if (p.sizes?.length) {
    variantFilter.size = { in: p.sizes };
    useVariant = true;
  }
  if (p.colors?.length) {
    variantFilter.color = { name: { in: p.colors } };
    useVariant = true;
  }
  if (p.available) {
    variantFilter.stock = { gt: 0 };
    useVariant = true;
  }
  if (useVariant) and.push({ variants: { some: variantFilter } });
  if (p.sale) and.push({ salePrice: { not: null } });
  if (p.min != null || p.max != null) {
    const range = { ...(p.min != null ? { gte: Math.round(p.min * 100) } : {}), ...(p.max != null ? { lte: Math.round(p.max * 100) } : {}) };
    and.push({ OR: [{ salePrice: null, price: range }, { salePrice: range }] });
  }
  return { AND: and };
}

function orderFor(sort: ListParams["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ price: "asc" }];
    case "price-desc":
      return [{ price: "desc" }];
    case "best":
      return [{ soldCount: "desc" }, { isBestSeller: "desc" }, { createdAt: "desc" }];
    case "featured":
      return [{ isFeatured: "desc" }, { createdAt: "desc" }];
    default:
      return [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
  }
}

export async function listProducts(params: ListParams) {
  const where = buildWhere(params);
  const page = Math.max(1, params.page ?? 1);
  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, include: cardInclude, orderBy: orderFor(params.sort), take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
    prisma.product.count({ where }),
  ]);
  let cards = rows.map(toCard);
  // Price sorts must respect sale prices.
  if (params.sort === "price-asc" || params.sort === "price-desc") {
    const eff = (c: ProductCardData) => (c.salePrice != null && c.salePrice < c.price ? c.salePrice : c.price);
    cards = cards.sort((a, b) => (params.sort === "price-asc" ? eff(a) - eff(b) : eff(b) - eff(a)));
  }
  return { products: cards, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export const getFacets = cache(async () => {
  const [sizes, colors, prices] = await Promise.all([
    prisma.productVariant.findMany({ where: { isActive: true, product: published }, distinct: ["size"], select: { size: true } }),
    prisma.productColor.findMany({ where: { product: published }, distinct: ["name"], select: { name: true, hex: true } }),
    prisma.product.aggregate({ where: published, _min: { price: true, salePrice: true }, _max: { price: true } }),
  ]);
  const min = Math.min(prices._min.price ?? 0, prices._min.salePrice ?? Infinity);
  return {
    sizes: sortSizes(sizes.map((s) => s.size)),
    colors: colors.sort((a, b) => a.name.localeCompare(b.name, "ar")),
    minPrice: Math.floor((Number.isFinite(min) ? min : 0) / 100),
    maxPrice: Math.ceil((prices._max.price ?? 0) / 100),
  };
});

export async function productCards(where: Prisma.ProductWhereInput, orderBy: Prisma.ProductOrderByWithRelationInput[], take: number) {
  const rows = await prisma.product.findMany({ where: { AND: [published, where] }, include: cardInclude, orderBy, take });
  return rows.map(toCard);
}

export const getNavCategories = cache(() =>
  prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, name: true, nameEn: true, imageUrl: true, description: true, isFeatured: true, _count: { select: { products: { where: published } } } } }),
);

export const getCollections = cache(() =>
  prisma.collection.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, name: true, nameEn: true, description: true, imageUrl: true } }),
);

export const getDefaultSizeChart = cache(() =>
  prisma.sizeChart.findFirst({ where: { isDefault: true }, include: { rows: { orderBy: { sortOrder: "asc" } } } }),
);

export const getProductBySlug = cache(async (slug: string) => {
  const product = await prisma.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: { include: { sizeChart: { include: { rows: { orderBy: { sortOrder: "asc" } } } } } },
      sizeChart: { include: { rows: { orderBy: { sortOrder: "asc" } } } },
      colors: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] },
      variants: { where: { isActive: true } },
    },
  });
  if (!product) return null;
  const chart = product.sizeChart ?? product.category?.sizeChart ?? (await getDefaultSizeChart());
  return { product, chart };
});

export async function relatedProducts(productId: string, categoryId: string | null) {
  return productCards({ id: { not: productId }, ...(categoryId ? { categoryId } : {}) }, [{ soldCount: "desc" }, { createdAt: "desc" }], 8);
}
