import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "لون غير صالح");

export const productPayloadSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2, "اسم المنتج مطلوب").max(120),
    slug: z.string().trim().max(100).optional(),
    categoryId: z.string().nullable(),
    description: z.string().trim().max(5000),
    careInstructions: z.string().trim().max(2000).optional(),
    price: z.number().int().min(1, "السعر مطلوب").max(10_000_000),
    salePrice: z.number().int().min(1).max(10_000_000).nullable(),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    isFeatured: z.boolean(),
    isBestSeller: z.boolean(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20),
    seoTitle: z.string().trim().max(70).optional(),
    seoDescription: z.string().trim().max(170).optional(),
    sizeChartId: z.string().nullable(),
    collectionIds: z.array(z.string()).max(20),
    colors: z.array(z.object({ key: z.string().min(1), id: z.string().optional(), name: z.string().trim().min(1, "اسم اللون مطلوب").max(40), hex })).max(20),
    images: z
      .array(
        z.object({
          id: z.string().optional(),
          url: z.string().min(1).max(500),
          key: z.string().max(300).nullable().optional(),
          width: z.number().int().nullable().optional(),
          height: z.number().int().nullable().optional(),
          colorKey: z.string().nullable(),
          isCover: z.boolean(),
          alt: z.string().max(160).optional(),
        }),
      )
      .max(60),
    variants: z
      .array(
        z.object({
          id: z.string().optional(),
          colorKey: z.string().min(1),
          size: z.string().trim().min(1).max(12),
          sku: z.string().trim().max(60).optional(),
          stock: z.number().int().min(0, "المخزون لا يكون سالباً").max(100000),
          stockBase: z.number().int().nullable(),
          priceAdjustment: z.number().int().min(-1_000_000).max(1_000_000),
          isActive: z.boolean(),
          lowStockThreshold: z.number().int().min(0).max(1000).nullable().optional(),
        }),
      )
      .max(300),
  })
  .superRefine((p, ctx) => {
    if (p.salePrice != null && p.salePrice >= p.price) ctx.addIssue({ code: "custom", path: ["salePrice"], message: "سعر الخصم يجب أن يكون أقل من السعر الأصلي" });
    const keys = new Set(p.colors.map((c) => c.key));
    const seen = new Set<string>();
    for (const v of p.variants) {
      if (!keys.has(v.colorKey)) ctx.addIssue({ code: "custom", path: ["variants"], message: "مقاس مرتبط بلون غير موجود" });
      const k = `${v.colorKey}|${v.size.toUpperCase()}`;
      if (seen.has(k)) ctx.addIssue({ code: "custom", path: ["variants"], message: `المقاس ${v.size} مكرر لنفس اللون` });
      seen.add(k);
    }
    for (const i of p.images) if (i.colorKey && !keys.has(i.colorKey)) ctx.addIssue({ code: "custom", path: ["images"], message: "صورة مرتبطة بلون محذوف" });
    if (p.status === "PUBLISHED") {
      if (!p.images.length) ctx.addIssue({ code: "custom", path: ["images"], message: "أضيفي صورة واحدة على الأقل قبل النشر" });
      if (!p.colors.length) ctx.addIssue({ code: "custom", path: ["colors"], message: "أضيفي لوناً واحداً على الأقل قبل النشر" });
      if (!p.variants.some((v) => v.isActive)) ctx.addIssue({ code: "custom", path: ["variants"], message: "أضيفي مقاساً واحداً على الأقل قبل النشر" });
    }
  });

export type ProductPayload = z.infer<typeof productPayloadSchema>;

export const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "ONE SIZE"];

export const COLOR_PRESETS = [
  { name: "أسود", hex: "#1F1A1C" },
  { name: "أبيض", hex: "#F5F2EE" },
  { name: "عاجي", hex: "#EFE8DF" },
  { name: "بيج", hex: "#CDB49A" },
  { name: "موكا", hex: "#7A5A4A" },
  { name: "بني", hex: "#5A3D2E" },
  { name: "عنابي", hex: "#6B2238" },
  { name: "وردي غباري", hex: "#D9A6B6" },
  { name: "زهري", hex: "#E8B4C0" },
  { name: "ليلكي", hex: "#B9A3C8" },
  { name: "زيتي", hex: "#5E6B4E" },
  { name: "أخضر زمردي", hex: "#2F5D50" },
  { name: "كحلي", hex: "#22304A" },
  { name: "أزرق سماوي", hex: "#9DB7CF" },
  { name: "رمادي", hex: "#8C8A88" },
  { name: "خردلي", hex: "#C49A3A" },
];
