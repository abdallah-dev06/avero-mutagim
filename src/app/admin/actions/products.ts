"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productPayloadSchema } from "@/lib/product-schema";
import { deleteStoredImage } from "@/lib/storage";
import { DomainError, publicMessage } from "@/server/errors";
import { adjustStock } from "@/server/inventory";
import { duplicateProduct, saveProductData } from "@/server/products";

type R<T = object> = ({ ok: true } & T) | { ok: false; error: string; issues?: string[] };

function refresh(id?: string) {
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/admin/products/${id}`);
}

export async function saveProduct(raw: unknown): Promise<R<{ id: string }>> {
  try {
    const user = await requireStaff();
    const parsed = productPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = [...new Set(parsed.error.issues.map((i) => i.message))];
      return { ok: false, error: issues[0] ?? "بيانات غير صالحة", issues };
    }
    const { productId, orphanKeys } = await saveProductData(prisma, parsed.data, user.id);
    await Promise.all(orphanKeys.map(deleteStoredImage));
    await audit({ actorId: user.id, action: parsed.data.id ? "product.update" : "product.create", entity: "Product", entityId: productId, data: { status: parsed.data.status } });
    refresh(productId);
    return { ok: true, id: productId };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

export async function setProductStatus(id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED"): Promise<R> {
  try {
    const user = await requireStaff();
    if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) throw new DomainError("حالة غير صالحة");
    const p = await prisma.product.findUnique({ where: { id }, include: { _count: { select: { images: true } }, variants: { where: { isActive: true }, select: { id: true } } } });
    if (!p) throw new DomainError("المنتج غير موجود");
    if (status === "PUBLISHED" && (!p._count.images || !p.variants.length)) throw new DomainError("لا يمكن النشر دون صورة ومقاس واحد على الأقل");
    await prisma.product.update({ where: { id }, data: { status, ...(status === "PUBLISHED" && !p.publishedAt ? { publishedAt: new Date() } : {}) } });
    await audit({ actorId: user.id, action: `product.${status.toLowerCase()}`, entity: "Product", entityId: id });
    refresh(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

export async function duplicateProductAction(id: string): Promise<R<{ id: string }>> {
  try {
    const user = await requireStaff();
    const newId = await duplicateProduct(prisma, id);
    await audit({ actorId: user.id, action: "product.duplicate", entity: "Product", entityId: newId, data: { from: id } });
    refresh();
    return { ok: true, id: newId };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

/** Permanent deletion is only possible for products that never appeared in an order. */
export async function deleteProduct(id: string, confirmName: string): Promise<R> {
  try {
    const user = await requireStaff({ adminOnly: true });
    const p = await prisma.product.findUnique({ where: { id }, include: { images: { select: { storageKey: true } } } });
    if (!p) throw new DomainError("المنتج غير موجود");
    if (confirmName.trim() !== p.name.trim()) throw new DomainError("اكتبي اسم المنتج كما هو لتأكيد الحذف");
    const ordered = await prisma.orderItem.count({ where: { productId: id } });
    if (ordered > 0) throw new DomainError("هذا المنتج موجود في طلبات سابقة — استخدمي الأرشفة بدلاً من الحذف");
    await prisma.product.delete({ where: { id } });
    for (const img of p.images) {
      if (img.storageKey && !(await prisma.productImage.count({ where: { storageKey: img.storageKey } }))) await deleteStoredImage(img.storageKey);
    }
    await audit({ actorId: user.id, action: "product.delete", entity: "Product", entityId: id, data: { name: p.name } });
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

const bulkSchema = z.array(z.object({ variantId: z.string(), stock: z.number().int().min(0).max(100000), base: z.number().int().min(0) })).min(1).max(500);

/** Bulk stock edit: each change is applied as an atomic delta vs. the value shown to the admin. */
export async function bulkUpdateStock(raw: unknown, reason: string): Promise<R<{ updated: number; failed: string[] }>> {
  try {
    const user = await requireStaff();
    const rows = bulkSchema.parse(raw);
    const note = String(reason ?? "").trim().slice(0, 200);
    if (!note) throw new DomainError("يرجى كتابة سبب التعديل");
    let updated = 0;
    const failed: string[] = [];
    for (const r of rows) {
      const delta = r.stock - r.base;
      if (!delta) continue;
      try {
        await adjustStock(prisma, { variantId: r.variantId, mode: "delta", value: delta, reason: "MANUAL", note, actorId: user.id });
        updated++;
      } catch (e) {
        failed.push(`${r.variantId}: ${publicMessage(e)}`);
      }
    }
    await audit({ actorId: user.id, action: "inventory.bulk", entity: "ProductVariant", data: { updated, failed: failed.length, reason: note } });
    refresh();
    return { ok: true, updated, failed };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

export async function toggleVariantActive(variantId: string, isActive: boolean): Promise<R> {
  try {
    const user = await requireStaff();
    await prisma.productVariant.update({ where: { id: variantId }, data: { isActive } });
    await audit({ actorId: user.id, action: "variant.active", entity: "ProductVariant", entityId: variantId, data: { isActive } });
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}
