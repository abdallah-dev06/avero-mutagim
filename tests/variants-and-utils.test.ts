import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { formatILS } from "@/lib/money";
import { normalizePhone } from "@/lib/phone";
import { findSize } from "@/lib/sizes";
import { defaultColor, galleryForColor, selectVariant } from "@/lib/variant-selection";
import { renderTemplate, waMeLink } from "@/lib/whatsapp";
import { csvEscape } from "@/server/admin-orders";
import { createOrder } from "@/server/orders";
import { saveProductData } from "@/server/products";
import type { ProductPayload } from "@/lib/product-schema";
import { productPayloadSchema } from "@/lib/product-schema";
import { customer, db, resetDb, seedCity } from "./helpers";

beforeEach(resetDb);
afterAll(() => db.$disconnect());

describe("product variant selection", () => {
  const variants = [
    { id: "b-s", colorId: "black", size: "S", stock: 5, priceAdjustment: 0 },
    { id: "b-m", colorId: "black", size: "M", stock: 0, priceAdjustment: 0 },
    { id: "r-l", colorId: "rose", size: "L", stock: 2, priceAdjustment: 500 },
    { id: "r-xs", colorId: "rose", size: "XS", stock: 1, priceAdjustment: 0 },
  ];
  it("scopes sizes and stock to the chosen colour", () => {
    const black = selectVariant(variants, "black", null);
    expect(black.sizes).toEqual(["S", "M"]);
    expect(black.colorStock).toBe(5);
    expect(black.variant).toBeNull();
    const rose = selectVariant(variants, "rose", "L");
    expect(rose.sizes).toEqual(["XS", "L"]); // ordered by size, only rose sizes
    expect(rose.variant?.id).toBe("r-l");
    expect(rose.maxQty).toBe(2);
  });
  it("does not carry a size that does not exist in the new colour", () => {
    expect(selectVariant(variants, "rose", "S").variant).toBeNull();
  });
  it("blocks purchase of out-of-stock combinations", () => {
    expect(selectVariant(variants, "black", "M").canPurchase).toBe(false);
    expect(selectVariant(variants, "black", "S").canPurchase).toBe(true);
  });
  it("auto-selects the only size", () => {
    const one = [{ id: "x", colorId: "c", size: "ONE SIZE", stock: 3, priceAdjustment: 0 }];
    expect(selectVariant(one, "c", null).variant?.id).toBe("x");
  });
  it("shows the chosen colour's images first and falls back gracefully", () => {
    const imgs = [
      { id: "1", colorId: "black" },
      { id: "2", colorId: "rose" },
      { id: "3", colorId: null },
      { id: "4", colorId: "black" },
    ];
    expect(galleryForColor(imgs, "black").map((i) => i.id)).toEqual(["1", "4", "3"]);
    expect(galleryForColor(imgs, "rose").map((i) => i.id)).toEqual(["2", "3"]);
    expect(galleryForColor(imgs, "navy").map((i) => i.id)).toEqual(["1", "2", "3", "4"]);
  });
  it("defaults to the first in-stock colour unless a valid one is requested", () => {
    const colors = [{ id: "black" }, { id: "rose" }];
    const allOutBlack = variants.map((v) => (v.colorId === "black" ? { ...v, stock: 0 } : v));
    expect(defaultColor(colors, allOutBlack)).toBe("rose");
    expect(defaultColor(colors, variants, "rose")).toBe("rose");
    expect(defaultColor(colors, variants, "bogus")).toBe("black");
  });
});

describe("product saving", () => {
  const base = (): ProductPayload => ({
    name: "عباية اختبار",
    categoryId: null,
    description: "وصف",
    price: 20000,
    salePrice: null,
    status: "PUBLISHED",
    isFeatured: false,
    isBestSeller: false,
    tags: [],
    sizeChartId: null,
    collectionIds: [],
    colors: [
      { key: "k1", name: "أسود", hex: "#000000" },
      { key: "k2", name: "بيج", hex: "#CDB49A" },
    ],
    images: [
      { url: "/a.webp", colorKey: "k1", isCover: true },
      { url: "/b.webp", colorKey: "k2", isCover: false },
    ],
    variants: [
      { colorKey: "k1", size: "M", stock: 4, stockBase: null, priceAdjustment: 0, isActive: true },
      { colorKey: "k2", size: "L", stock: 1, stockBase: null, priceAdjustment: 0, isActive: true },
    ],
  });

  it("validates publish requirements and sale price", () => {
    expect(productPayloadSchema.safeParse({ ...base(), images: [] }).success).toBe(false);
    expect(productPayloadSchema.safeParse({ ...base(), salePrice: 25000 }).success).toBe(false);
    const dup = base();
    dup.variants.push({ colorKey: "k1", size: "m", stock: 1, stockBase: null, priceAdjustment: 0, isActive: true });
    expect(productPayloadSchema.safeParse(dup).success).toBe(false);
    expect(productPayloadSchema.safeParse(base()).success).toBe(true);
  });

  it("creates one SKU per colour/size with per-colour images, and applies stock as deltas", async () => {
    const { productId } = await saveProductData(db, base(), null);
    const p = await db.product.findUniqueOrThrow({ where: { id: productId }, include: { variants: true, images: true, colors: true } });
    expect(p.variants).toHaveLength(2);
    expect(new Set(p.variants.map((v) => v.sku)).size).toBe(2);
    expect(p.images.find((i) => i.url === "/b.webp")?.colorId).toBe(p.colors.find((c) => c.name === "بيج")?.id);

    // Simulate an order happening while the admin edits: stock 4 → 3
    const vM = p.variants.find((v) => v.size === "M")!;
    await db.productVariant.update({ where: { id: vM.id }, data: { stock: 3 } });
    const edit = base();
    edit.id = productId;
    edit.colors = p.colors.map((c) => ({ key: c.id, id: c.id, name: c.name, hex: c.hex }));
    edit.images = p.images.map((i) => ({ id: i.id, url: i.url, colorKey: i.colorId, isCover: i.isCover }));
    edit.variants = p.variants.map((v) => ({ id: v.id, colorKey: v.colorId, size: v.size, sku: v.sku, stock: v.size === "M" ? 10 : v.stock, stockBase: v.size === "M" ? 4 : v.stock, priceAdjustment: 0, isActive: true }));
    await saveProductData(db, edit, null);
    // admin added +6 relative to what they saw (4) → 3 + 6 = 9, the concurrent sale is preserved
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: vM.id } })).stock).toBe(9);
  });

  it("deactivates (never deletes) variants that appear in orders", async () => {
    const { productId } = await saveProductData(db, base(), null);
    const p = await db.product.findUniqueOrThrow({ where: { id: productId }, include: { variants: true, colors: true, images: true } });
    const city = await seedCity();
    await createOrder(db, { lines: [{ variantId: p.variants[0].id, quantity: 1 }], customer: customer(city.id), shippingFee: 0 });
    const edit = base();
    edit.id = productId;
    edit.colors = p.colors.map((c) => ({ key: c.id, id: c.id, name: c.name, hex: c.hex }));
    edit.images = p.images.map((i) => ({ id: i.id, url: i.url, colorKey: i.colorId, isCover: i.isCover }));
    edit.variants = []; // admin removed all sizes
    edit.status = "DRAFT";
    await saveProductData(db, edit, null);
    const after = await db.productVariant.findMany({ where: { productId } });
    expect(after).toHaveLength(1); // the ordered one survives, inactive
    expect(after[0].isActive).toBe(false);
    expect(await db.orderItem.count({ where: { variantId: after[0].id } })).toBe(1);
  });
});

describe("size finder", () => {
  const rows = [
    { label: "S", euSize: "38", bustCm: 92, waistCm: 72, hipsCm: 99 },
    { label: "M", euSize: "40", bustCm: 97, waistCm: 77, hipsCm: 103 },
    { label: "L", euSize: "44", bustCm: 107, waistCm: 88, hipsCm: 112 },
  ];
  it("suggests the smallest size that fits every measurement", () => {
    const r = findSize(rows, { bust: 93, waist: 70, hips: 100 });
    expect(r.kind === "match" && r.row.label).toBe("M");
  });
  it("explains when measurements exceed the chart", () => {
    expect(findSize(rows, { hips: 130 }).kind).toBe("too-large");
    expect(findSize(rows, {}).kind).toBe("insufficient");
  });
});

describe("utilities", () => {
  it("normalises Palestinian phone numbers to E.164", () => {
    expect(normalizePhone("0599 571 202")).toBe("+970599571202");
    expect(normalizePhone("+970 56 123 4567")).toBe("+970561234567");
    expect(normalizePhone("٠٥٩٩٥٧١٢٠٢")).toBe("+970599571202");
    expect(normalizePhone("123")).toBeNull();
  });
  it("formats ILS", () => {
    expect(formatILS(18900)).toBe("189 ₪");
    expect(formatILS(1950)).toBe("19.50 ₪");
  });
  it("builds encoded wa.me drafts from templates", () => {
    const text = renderTemplate("مرحباً {name}، طلبك {reference} {status} — {total}", { name: "سارة أحمد", reference: "VB-AAAA-BBBB", status: "CONFIRMED", total: 18900, items: [], store: "V" });
    expect(text).toBe("مرحباً سارة، طلبك VB-AAAA-BBBB تم التأكيد — 189 شيكل");
    const link = waMeLink("+970599571202", text);
    expect(link.startsWith("https://wa.me/970599571202?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toBe(text);
  });
  it("neutralises CSV formula injection", () => {
    expect(csvEscape("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvEscape('a,"b"')).toBe('"a,""b"""');
  });
});
