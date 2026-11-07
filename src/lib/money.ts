/** All money is stored and computed as integer agorot (1 ₪ = 100 agorot). */
export function formatILS(agorot: number) {
  const value = agorot / 100;
  const text = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${text} ₪`;
}

export function toAgorot(shekels: number) {
  return Math.round(shekels * 100);
}

export function fromAgorot(agorot: number) {
  return agorot / 100;
}

export function effectivePrice(p: { price: number; salePrice: number | null }) {
  return p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
}

export function discountPercent(p: { price: number; salePrice: number | null }) {
  const eff = effectivePrice(p);
  return eff < p.price ? Math.round(((p.price - eff) / p.price) * 100) : 0;
}
