import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/settings-schema";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log("Updating Neon DB settings & categories for AVERO MUTAGIM...");

  // 1. Update site settings
  await prisma.setting.upsert({
    where: { key: "site" },
    create: {
      key: "site",
      value: DEFAULT_SETTINGS as never,
    },
    update: {
      value: DEFAULT_SETTINGS as never,
    },
  });
  console.log("✓ Site settings updated to AVERO MUTAGIM in database!");

  // 2. Define Men's Fashion Categories
  const mensCategories = [
    {
      slug: "suits",
      name: "البدل والبليزر",
      nameEn: "Suits & Blazers",
      description: "تشكيلة بدل رجالية فاخرة وبليزر عصري بتصاميم استثنائية وأقمشة راقية لمظهر متكامل وأنيق.",
      sortOrder: 1,
      imageUrl: "/products/black-elegance-set-1.webp",
    },
    {
      slug: "shirts",
      name: "القمصان",
      nameEn: "Shirts",
      description: "قمصان كلاسيكية وكاجوال منتقاة من أشهر العلامات التجارية لجميع الإطلالات اليومية والرسمية.",
      sortOrder: 2,
      imageUrl: "/products/ivory-chic-blouse-1.webp",
    },
    {
      slug: "trousers",
      name: "البناطيل",
      nameEn: "Trousers",
      description: "بناطيل قماشية وجينز بقصات مريحة وتفاصيل متقنة تليق بذوقك الرفيع.",
      sortOrder: 3,
      imageUrl: "/products/grey-chic-blouse-2.webp",
    },
    {
      slug: "outerwear",
      name: "الجاكيتات والمعاطف",
      nameEn: "Outerwear & Jackets",
      description: "جاكيتات ومعاطف رجالية شتوية وانتقالية تجمع بين الفخامة والدفء بأسلوب عصري.",
      sortOrder: 4,
      imageUrl: "/products/royal-winter-coat-1.webp",
    },
    {
      slug: "knitwear",
      name: "الكنزات والبلايز",
      nameEn: "Knitwear & Tops",
      description: "كنزات صوفية وبلايز شيك بتفاصيل راقية وعصرية لمختلف الأوقات والمناسبات.",
      sortOrder: 5,
      imageUrl: "/products/grey-chic-blouse-1.webp",
    },
    {
      slug: "accessories",
      name: "الإكسسوارات",
      nameEn: "Accessories",
      description: "أحزمة جلدية وإكسسوارات رجالية فاخرة تُكمل إطلالتك وتمنحها لمسة من التميز.",
      sortOrder: 6,
      imageUrl: "/products/black-dots-blouse-2.webp",
    },
  ];

  const catMap: Record<string, string> = {};

  for (const cat of mensCategories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: {
        slug: cat.slug,
        name: cat.name,
        nameEn: cat.nameEn,
        description: cat.description,
        sortOrder: cat.sortOrder,
        imageUrl: cat.imageUrl,
        isActive: true,
        isFeatured: true,
      },
      update: {
        name: cat.name,
        nameEn: cat.nameEn,
        description: cat.description,
        sortOrder: cat.sortOrder,
        imageUrl: cat.imageUrl,
        isActive: true,
        isFeatured: true,
      },
    });
    catMap[cat.slug] = record.id;
    console.log(`✓ Category: ${record.name} (${record.slug})`);
  }

  // Also update old categories if any exist
  const oldCoats = await prisma.category.findUnique({ where: { slug: "coats" } });
  if (oldCoats && catMap.outerwear) {
    await prisma.product.updateMany({
      where: { categoryId: oldCoats.id },
      data: { categoryId: catMap.outerwear },
    });
    console.log("✓ Re-assigned products from coats -> outerwear");
  }

  const oldAbayas = await prisma.category.findUnique({ where: { slug: "abayas" } });
  if (oldAbayas && catMap.suits) {
    await prisma.product.updateMany({
      where: { categoryId: oldAbayas.id },
      data: { categoryId: catMap.suits },
    });
    console.log("✓ Re-assigned products from abayas -> suits");
  }

  const oldBlouses = await prisma.category.findUnique({ where: { slug: "blouses" } });
  if (oldBlouses && catMap.knitwear) {
    await prisma.product.updateMany({
      where: { categoryId: oldBlouses.id },
      data: { categoryId: catMap.knitwear },
    });
    console.log("✓ Re-assigned products from blouses -> knitwear");
  }

  // Deactivate old unused categories so only the 6 men's fashion categories appear
  await prisma.category.updateMany({
    where: {
      slug: { in: ["coats", "abayas", "blouses", "scarves", "sets"] },
    },
    data: {
      isActive: false,
      isFeatured: false,
    },
  });
  console.log("✓ Cleaned up old category entries.");

  console.log("\nAVERO MUTAGIM Database setup completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error updating DB:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
