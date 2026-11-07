import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

export const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

export async function resetDb() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'`;
  if (tables.length) await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
}

let n = 0;
/** One published product with two colours; returns variant ids keyed "color/size". */
export async function seedProduct(opts: { stock?: Record<string, number>; price?: number; salePrice?: number | null; status?: "PUBLISHED" | "DRAFT" } = {}) {
  n++;
  const stock = opts.stock ?? { "black/S": 5, "black/M": 3, "rose/M": 0, "rose/L": 2 };
  const product = await db.product.create({
    data: { slug: `p-${n}-${Date.now()}`, name: `منتج ${n}`, price: opts.price ?? 10000, salePrice: opts.salePrice ?? null, status: opts.status ?? "PUBLISHED" },
  });
  const colors: Record<string, string> = {};
  for (const c of ["black", "rose"]) colors[c] = (await db.productColor.create({ data: { productId: product.id, name: c, hex: "#000000" } })).id;
  await db.productImage.createMany({
    data: [
      { productId: product.id, colorId: colors.black, url: "/b1.webp", isCover: true },
      { productId: product.id, colorId: colors.rose, url: "/r1.webp" },
      { productId: product.id, colorId: null, url: "/shared.webp" },
    ],
  });
  const variants: Record<string, string> = {};
  for (const [key, qty] of Object.entries(stock)) {
    const [c, size] = key.split("/");
    variants[key] = (await db.productVariant.create({ data: { productId: product.id, colorId: colors[c], size, sku: `T${n}-${c}-${size}-${Math.random().toString(36).slice(2, 6)}`, stock: qty } })).id;
  }
  return { product, colors, variants };
}

export async function seedCity() {
  const city = await db.city.create({ data: { name: `مدينة ${Math.random().toString(36).slice(2, 7)}`, areas: { create: { name: "المركز" } } } });
  return city;
}

export const customer = (cityId: string) => ({ customerName: "زبونة اختبار", phone: "+970599123456", cityId, areaName: "المركز", addressLine: "شارع الاختبار" });
