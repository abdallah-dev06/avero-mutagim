import "server-only";
import type { EditorState } from "@/components/admin/product-editor";
import { prisma } from "@/lib/db";

export async function editorOptions() {
  const [categories, collections, sizeCharts] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.collection.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.sizeChart.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isDefault: true } }),
  ]);
  return { categories, collections, sizeCharts };
}

export const EMPTY_EDITOR: EditorState = {
  name: "",
  slug: "",
  categoryId: null,
  description: "",
  careInstructions: "",
  price: "",
  salePrice: "",
  status: "DRAFT",
  isFeatured: false,
  isBestSeller: false,
  tags: [],
  seoTitle: "",
  seoDescription: "",
  sizeChartId: null,
  collectionIds: [],
  colors: [],
  images: [],
  variants: [],
};

export async function loadEditorState(id: string): Promise<{ state: EditorState; isDemo: boolean; status: string; hasOrders: boolean } | null> {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      colors: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
      collections: { select: { id: true } },
    },
  });
  if (!p) return null;
  const hasOrders = (await prisma.orderItem.count({ where: { productId: id } })) > 0;
  const keyOf = (colorId: string | null) => colorId ?? null;
  const activeColorIds = new Set(p.variants.map((v) => v.colorId));
  return {
    isDemo: p.isDemo,
    status: p.status,
    hasOrders,
    state: {
      id: p.id,
      name: p.name,
      slug: p.slug,
      categoryId: p.categoryId,
      description: p.description,
      careInstructions: p.careInstructions ?? "",
      price: String(p.price / 100),
      salePrice: p.salePrice != null ? String(p.salePrice / 100) : "",
      status: p.status === "ARCHIVED" ? "DRAFT" : p.status,
      isFeatured: p.isFeatured,
      isBestSeller: p.isBestSeller,
      tags: p.tags,
      seoTitle: p.seoTitle ?? "",
      seoDescription: p.seoDescription ?? "",
      sizeChartId: p.sizeChartId,
      collectionIds: p.collections.map((c) => c.id),
      colors: p.colors.filter((c) => activeColorIds.has(c.id) || true).map((c) => ({ key: c.id, id: c.id, name: c.name, hex: c.hex })),
      images: p.images.map((i) => ({ uid: i.id, id: i.id, url: i.url, key: i.storageKey, width: i.width, height: i.height, colorKey: keyOf(i.colorId), isCover: i.isCover, alt: i.alt ?? undefined })),
      variants: p.variants.map((v) => ({
        uid: v.id,
        id: v.id,
        colorKey: v.colorId,
        size: v.size,
        sku: v.sku,
        stock: v.stock,
        stockBase: v.stock,
        priceAdjustment: v.priceAdjustment ? String(v.priceAdjustment / 100) : "",
        isActive: v.isActive,
        lowStockThreshold: v.lowStockThreshold,
      })),
    },
  };
}
