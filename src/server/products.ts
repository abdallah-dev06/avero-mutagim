import type { PrismaClient } from "@/generated/prisma/client";
import { randomToken } from "@/lib/crypto";
import type { ProductPayload } from "@/lib/product-schema";
import { slugify } from "@/lib/utils";
import { DomainError } from "@/server/errors";

type Db = PrismaClient;
type Tx = Parameters<Parameters<Db["$transaction"]>[0]>[0];

async function uniqueSlug(tx: Tx, base: string, excludeId?: string) {
  let slug = slugify(base);
  for (let i = 0; i < 20; i++) {
    const clash = await tx.product.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
    if (!clash) return slug;
    slug = `${slugify(base)}-${randomToken(3).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  }
  throw new DomainError("تعذّر إنشاء رابط فريد للمنتج");
}

async function uniqueSku(tx: Tx, wanted: string, excludeId?: string) {
  let sku = wanted.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 50) || `VB-${randomToken(4).toUpperCase()}`;
  for (let i = 0; i < 20; i++) {
    const clash = await tx.productVariant.findFirst({ where: { sku, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
    if (!clash) return sku;
    sku = `${sku.slice(0, 44)}-${randomToken(3).toUpperCase().replace(/[^A-Z0-9]/g, "X")}`;
  }
  throw new DomainError("تعذّر إنشاء SKU فريد");
}

/**
 * Persists the whole product aggregate atomically. Stock edits are applied as deltas
 * against the value the editor loaded (stockBase), so concurrent orders are never lost.
 * Variants/colours that appear in past orders are deactivated instead of deleted.
 */
export async function saveProductData(db: Db, p: ProductPayload, actorId: string | null) {
  const removedKeys: string[] = [];
  const productId = await db.$transaction(
    async (tx) => {
      const data = {
        name: p.name,
        description: p.description,
        careInstructions: p.careInstructions || null,
        categoryId: p.categoryId || null,
        price: p.price,
        salePrice: p.salePrice,
        status: p.status,
        isFeatured: p.isFeatured,
        isBestSeller: p.isBestSeller,
        tags: [...new Set(p.tags)],
        seoTitle: p.seoTitle || null,
        seoDescription: p.seoDescription || null,
        sizeChartId: p.sizeChartId || null,
      };
      let product;
      if (p.id) {
        const existing = await tx.product.findUnique({ where: { id: p.id } });
        if (!existing) throw new DomainError("المنتج غير موجود");
        const slug = p.slug && p.slug !== existing.slug ? await uniqueSlug(tx, p.slug, p.id) : existing.slug;
        product = await tx.product.update({
          where: { id: p.id },
          data: { ...data, slug, publishedAt: p.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt, collections: { set: p.collectionIds.map((id) => ({ id })) } },
        });
      } else {
        const slug = await uniqueSlug(tx, p.slug || p.name);
        product = await tx.product.create({
          data: { ...data, slug, publishedAt: p.status === "PUBLISHED" ? new Date() : null, collections: { connect: p.collectionIds.map((id) => ({ id })) } },
        });
      }

      // ── Colours
      const existingColors = await tx.productColor.findMany({ where: { productId: product.id }, include: { variants: { include: { _count: { select: { orderItems: true } } } } } });
      const keyToId = new Map<string, string>();
      for (const [i, c] of p.colors.entries()) {
        const match = c.id ? existingColors.find((e) => e.id === c.id) : undefined;
        if (match) {
          await tx.productColor.update({ where: { id: match.id }, data: { name: c.name, hex: c.hex, sortOrder: i } });
          keyToId.set(c.key, match.id);
        } else {
          const created = await tx.productColor.create({ data: { productId: product.id, name: c.name, hex: c.hex, sortOrder: i } });
          keyToId.set(c.key, created.id);
        }
      }
      const keptColorIds = new Set(keyToId.values());
      for (const c of existingColors) {
        if (keptColorIds.has(c.id)) continue;
        const ordered = c.variants.some((v) => v._count.orderItems > 0);
        if (ordered) {
          await tx.productVariant.updateMany({ where: { colorId: c.id }, data: { isActive: false } });
          await tx.productImage.updateMany({ where: { colorId: c.id }, data: { colorId: null } });
        } else {
          const imgs = await tx.productImage.findMany({ where: { colorId: c.id }, select: { storageKey: true } });
          imgs.forEach((i) => i.storageKey && removedKeys.push(i.storageKey));
          await tx.productColor.delete({ where: { id: c.id } });
        }
      }

      // ── Images
      const existingImages = await tx.productImage.findMany({ where: { productId: product.id } });
      const keepImageIds = new Set(p.images.filter((i) => i.id).map((i) => i.id!));
      for (const img of existingImages) {
        if (!keepImageIds.has(img.id)) {
          if (img.storageKey) removedKeys.push(img.storageKey);
          await tx.productImage.delete({ where: { id: img.id } }).catch(() => undefined);
        }
      }
      const coverIndex = Math.max(0, p.images.findIndex((i) => i.isCover));
      for (const [i, img] of p.images.entries()) {
        const imgData = {
          url: img.url,
          storageKey: img.key ?? null,
          width: img.width ?? null,
          height: img.height ?? null,
          colorId: img.colorKey ? (keyToId.get(img.colorKey) ?? null) : null,
          isCover: i === coverIndex,
          sortOrder: i,
          alt: img.alt || p.name,
        };
        if (img.id && existingImages.some((e) => e.id === img.id)) await tx.productImage.update({ where: { id: img.id }, data: imgData });
        else await tx.productImage.create({ data: { ...imgData, productId: product.id } });
      }

      // ── Variants
      const existingVariants = await tx.productVariant.findMany({ where: { productId: product.id }, include: { _count: { select: { orderItems: true } } } });
      const keepVariantIds = new Set<string>();
      const short = slugify(p.slug || p.name).replace(/[^a-z0-9]/g, "").slice(0, 6).toUpperCase() || product.id.slice(-6).toUpperCase();
      for (const v of p.variants) {
        const colorId = keyToId.get(v.colorKey)!;
        const size = v.size.toUpperCase() === "ONE SIZE" ? "ONE SIZE" : v.size.toUpperCase();
        const match = v.id ? existingVariants.find((e) => e.id === v.id) : existingVariants.find((e) => e.colorId === colorId && e.size === size);
        if (match) {
          keepVariantIds.add(match.id);
          const sku = v.sku && v.sku !== match.sku ? await uniqueSku(tx, v.sku, match.id) : match.sku;
          await tx.productVariant.update({
            where: { id: match.id },
            data: { size, sku, priceAdjustment: v.priceAdjustment, isActive: v.isActive, lowStockThreshold: v.lowStockThreshold ?? null, colorId },
          });
          const base = v.stockBase ?? match.stock;
          const delta = v.stock - base;
          if (delta !== 0) {
            const res = await tx.productVariant.updateMany({ where: { id: match.id, ...(delta < 0 ? { stock: { gte: -delta } } : {}) }, data: { stock: { increment: delta } } });
            if (res.count !== 1) throw new DomainError(`تغيّر مخزون ${size} أثناء التعديل (ربما بسبب طلب جديد). حدّثي الصفحة وأعيدي المحاولة.`);
            const after = await tx.productVariant.findUniqueOrThrow({ where: { id: match.id }, select: { stock: true } });
            await tx.stockMovement.create({ data: { variantId: match.id, delta, stockAfter: after.stock, reason: "MANUAL", note: "تعديل من صفحة المنتج", actorId } });
          }
        } else {
          const colorIndex = p.colors.findIndex((c) => c.key === v.colorKey) + 1;
          const sku = await uniqueSku(tx, v.sku || `VB-${short}-${colorIndex}-${size.replace(/\s/g, "")}`);
          const created = await tx.productVariant.create({
            data: { productId: product.id, colorId, size, sku, stock: v.stock, priceAdjustment: v.priceAdjustment, isActive: v.isActive, lowStockThreshold: v.lowStockThreshold ?? null },
          });
          keepVariantIds.add(created.id);
          if (v.stock > 0) await tx.stockMovement.create({ data: { variantId: created.id, delta: v.stock, stockAfter: v.stock, reason: "INITIAL", actorId } });
        }
      }
      for (const e of existingVariants) {
        if (keepVariantIds.has(e.id)) continue;
        if (e._count.orderItems > 0) await tx.productVariant.update({ where: { id: e.id }, data: { isActive: false } });
        else await tx.productVariant.delete({ where: { id: e.id } }).catch(() => undefined);
      }
      return product.id;
    },
    { timeout: 20000 },
  );

  // Storage objects are only removed when no other product (e.g. a duplicate) still references them.
  const orphanKeys: string[] = [];
  for (const key of new Set(removedKeys)) {
    const still = await db.productImage.count({ where: { storageKey: key } });
    if (!still) orphanKeys.push(key);
  }
  return { productId, orphanKeys };
}

export async function duplicateProduct(db: Db, id: string) {
  return db.$transaction(async (tx) => {
    const src = await tx.product.findUnique({ where: { id }, include: { colors: true, images: true, variants: true, collections: { select: { id: true } } } });
    if (!src) throw new DomainError("المنتج غير موجود");
    const slug = await uniqueSlug(tx, `${src.slug}-copy`);
    const copy = await tx.product.create({
      data: {
        name: `${src.name} (نسخة)`,
        slug,
        description: src.description,
        careInstructions: src.careInstructions,
        categoryId: src.categoryId,
        price: src.price,
        salePrice: src.salePrice,
        status: "DRAFT",
        isFeatured: false,
        isBestSeller: false,
        tags: src.tags,
        seoTitle: src.seoTitle,
        seoDescription: src.seoDescription,
        sizeChartId: src.sizeChartId,
        isDemo: src.isDemo,
        collections: { connect: src.collections },
      },
    });
    const colorMap = new Map<string, string>();
    for (const c of src.colors) {
      const nc = await tx.productColor.create({ data: { productId: copy.id, name: c.name, hex: c.hex, sortOrder: c.sortOrder } });
      colorMap.set(c.id, nc.id);
    }
    for (const img of src.images) {
      await tx.productImage.create({ data: { productId: copy.id, colorId: img.colorId ? colorMap.get(img.colorId) : null, url: img.url, storageKey: img.storageKey, alt: img.alt, width: img.width, height: img.height, sortOrder: img.sortOrder, isCover: img.isCover } });
    }
    for (const v of src.variants) {
      // Stock starts at 0 for the copy — inventory is never duplicated.
      await tx.productVariant.create({ data: { productId: copy.id, colorId: colorMap.get(v.colorId)!, size: v.size, sku: await uniqueSku(tx, `${v.sku}-C`), stock: 0, priceAdjustment: v.priceAdjustment, isActive: v.isActive } });
    }
    return copy.id;
  });
}
