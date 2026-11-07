import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { effectivePrice } from "@/lib/money";
import { findShopper } from "@/lib/shopper";

export type CartLine = {
  id: string;
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  colorName: string;
  colorHex: string;
  size: string;
  image: string | null;
  unitPrice: number;
  compareAt: number | null;
  quantity: number;
  stock: number;
  available: boolean;
  issue: string | null;
  lineTotal: number;
};

/** Server-computed cart view. Prices always come from the database. */
export const getCart = cache(async () => {
  const shopper = await findShopper();
  if (!shopper) return { shopperId: null, lines: [] as CartLine[], subtotal: 0, count: 0, hasIssues: false, wishlistIds: [] as string[] };
  const [items, wish] = await Promise.all([
    prisma.cartItem.findMany({
      where: { shopperId: shopper.id },
      orderBy: { createdAt: "asc" },
      include: {
        variant: {
          include: {
            color: true,
            product: { include: { images: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], select: { url: true, colorId: true } } } },
          },
        },
      },
    }),
    prisma.wishlistItem.findMany({ where: { shopperId: shopper.id }, select: { productId: true } }),
  ]);
  const lines: CartLine[] = items.map((i) => {
    const v = i.variant;
    const p = v.product;
    const unitPrice = Math.max(0, effectivePrice(p) + v.priceAdjustment);
    const sellable = v.isActive && p.status === "PUBLISHED";
    const issue = !sellable ? "لم يعد هذا المنتج متاحاً" : v.stock <= 0 ? "نفدت الكمية" : i.quantity > v.stock ? `المتوفر ${v.stock} فقط` : null;
    return {
      id: i.id,
      variantId: v.id,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      colorName: v.color.name,
      colorHex: v.color.hex,
      size: v.size,
      image: (p.images.find((im) => im.colorId === v.colorId) ?? p.images[0])?.url ?? null,
      unitPrice,
      compareAt: unitPrice < p.price + v.priceAdjustment ? p.price + v.priceAdjustment : null,
      quantity: i.quantity,
      stock: v.stock,
      available: sellable && v.stock > 0,
      issue,
      lineTotal: unitPrice * i.quantity,
    };
  });
  const valid = lines.filter((l) => !l.issue);
  return {
    shopperId: shopper.id,
    lines,
    subtotal: valid.reduce((s, l) => s + l.lineTotal, 0),
    count: lines.reduce((s, l) => s + l.quantity, 0),
    hasIssues: lines.some((l) => l.issue),
    wishlistIds: wish.map((w) => w.productId),
  };
});
