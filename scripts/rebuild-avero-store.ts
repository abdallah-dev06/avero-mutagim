import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/settings-schema";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log("=== Rebuilding AVERO MUTAGIM Store Database ===");

  // 1. Wipe old cart, wishlist, stock movements, and products
  console.log("Cleaning up old products and related records...");
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productColor.deleteMany({});
  await prisma.product.deleteMany({});
  console.log("✓ All old products cleaned up!");

  // 2. Wipe old testimonials
  console.log("Cleaning up old testimonials...");
  await prisma.testimonial.deleteMany({});
  console.log("✓ All old testimonials wiped!");

  // 3. Remove old female categories
  console.log("Cleaning up old categories...");
  await prisma.category.deleteMany({
    where: {
      slug: {
        in: ["abayas", "blouses", "scarves", "sets", "coats", "demo-abayas", "demo-blouses"],
      },
    },
  });

  // 4. Upsert the 6 Men's Fashion Categories
  console.log("Creating Men's Fashion categories...");
  const categories = [
    {
      slug: "suits",
      name: "البدل والبليزر",
      nameEn: "Suits & Blazers",
      description: "تشكيلة راقية من البدل الرجالية الإيطالية والبليزر العصري للمناسبات الرسمية والخاصة بأعلى معايير الخياطة.",
      sortOrder: 1,
      isFeatured: true,
      isActive: true,
    },
    {
      slug: "shirts",
      name: "القمصان",
      nameEn: "Shirts",
      description: "قمصان كلاسيكية وكاجوال من أفخر أقمشة القطن الإيطالي بقصات سليم فيت ومريحة تناسب يومك.",
      sortOrder: 2,
      isFeatured: true,
      isActive: true,
    },
    {
      slug: "trousers",
      name: "البناطيل",
      nameEn: "Trousers",
      description: "بناطيل قماش رسمية وعصرية بقصات دقيقة ومريحة تمنحك إطلالة متناسقة وأنيقة.",
      sortOrder: 3,
      isFeatured: true,
      isActive: true,
    },
    {
      slug: "outerwear",
      name: "الجاكيتات والمعاطف",
      nameEn: "Outerwear & Jackets",
      description: "معاطف وجاكيتات شتوية فاخرة بتصاميم تجمع بين الدفء والفخامة والهيبة المطلقة.",
      sortOrder: 4,
      isFeatured: true,
      isActive: true,
    },
    {
      slug: "knitwear",
      name: "الكنزات والبلايز",
      nameEn: "Knitwear & Tops",
      description: "كنزات صوف وبلايز شبابية ناعمة بتفاصيل عصرية راقية تلائم مختلف أوقات اليوم.",
      sortOrder: 5,
      isFeatured: true,
      isActive: true,
    },
    {
      slug: "accessories",
      name: "الإكسسوارات",
      nameEn: "Accessories",
      description: "إكسسوارات جلدية فاخرة، أحزمة ومحافظ ومقتنيات تكمل أناقة الرجل العصري.",
      sortOrder: 6,
      isFeatured: true,
      isActive: true,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: cat,
    });
  }
  console.log("✓ 6 Men's Fashion categories ready!");

  // 5. Add authentic Men's Fashion Testimonials
  console.log("Inserting Men's Fashion Testimonials...");
  const testimonials = [
    {
      name: "علاء كنعان",
      city: "حيفا",
      text: "خامة البدل والقمصان فوق الوصف، القصة متناسقة جداً والتعامل راقٍ ومهني للغاية. بدون مبالغة أفضل متجر ملابس رجالية وشبابية تعاملت معه.",
      rating: 5,
      sortOrder: 1,
      isActive: true,
    },
    {
      name: "محمد خطيب",
      city: "دير الأسد",
      text: "التوصيل كان سريعاً جداً والخامة إيطالية أصلية من الدرجة الأولى. التفاصيل والأزرار والخياطة شيء فاخر، شكراً فريق أفيرو موتاجيم على الذوق العالي.",
      rating: 5,
      sortOrder: 2,
      isActive: true,
    },
    {
      name: "يوسف ناصر",
      city: "القدس",
      text: "الجاكيت والبنطال جودتهم ممتازة ومقاساتهم مضبوطة بالسنتيمتر. تجربة تسوق راقية والدفع عند الاستلام مريح ومضمون.",
      rating: 5,
      sortOrder: 3,
      isActive: true,
    },
    {
      name: "رامي عيسى",
      city: "الرامة",
      text: "أزياء شبابية راقية وألوان أنيقة تليق بالشباب الباحثين عن التميز والجاذبية. متجر فخم ويستحق كل تقدير.",
      rating: 5,
      sortOrder: 4,
      isActive: true,
    },
  ];

  for (const t of testimonials) {
    await prisma.testimonial.create({ data: t });
  }
  console.log("✓ Men's Testimonials created!");

  // 6. Update Site Settings (Brand defaults)
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
  console.log("✓ Site Settings confirmed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
