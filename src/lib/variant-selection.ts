import { sortSizes } from "@/lib/sizes";

export type SelVariant = { id: string; colorId: string; size: string; stock: number; priceAdjustment: number };
export type SelImage = { id: string; colorId: string | null };

/** Everything the product page needs for the current colour/size choice. Pure & testable. */
export function selectVariant<V extends SelVariant>(variants: V[], colorId: string | null, size: string | null) {
  const colorVariants = variants.filter((v) => v.colorId === colorId);
  const sizes = sortSizes(colorVariants.map((v) => v.size));
  const singleSize = sizes.length === 1 ? sizes[0] : null;
  const effectiveSize = size && sizes.includes(size) ? size : singleSize;
  const variant = colorVariants.find((v) => v.size === effectiveSize) ?? null;
  const colorStock = colorVariants.reduce((s, v) => s + Math.max(0, v.stock), 0);
  return {
    colorVariants,
    sizes,
    effectiveSize,
    variant,
    colorStock,
    canPurchase: !!variant && variant.stock > 0,
    maxQty: Math.min(variant?.stock ?? 0, 20),
  };
}

/** Images for the chosen colour first (plus shared images); falls back to all images. */
export function galleryForColor<I extends SelImage>(images: I[], colorId: string | null) {
  const own = images.filter((i) => i.colorId === colorId);
  const shared = images.filter((i) => !i.colorId);
  return own.length ? [...own, ...shared] : images;
}

export function defaultColor<V extends SelVariant>(colors: { id: string }[], variants: V[], requested?: string | null) {
  if (requested && colors.some((c) => c.id === requested)) return requested;
  return colors.find((c) => variants.some((v) => v.colorId === c.id && v.stock > 0))?.id ?? colors[0]?.id ?? null;
}
