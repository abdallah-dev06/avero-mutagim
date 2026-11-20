import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log("Seeding AVERO MUTAGIM luxury men's products...");

  // Update categories with imageUrl
  const catImageMap: Record<string, string> = {
    suits: "/categories/suits.webp",
    shirts: "/categories/shirts.webp",
    trousers: "/categories/trousers.webp",
    outerwear: "/categories/outerwear.webp",
    knitwear: "/categories/knitwear.webp",
    accessories: "/categories/accessories.webp",
  };

  for (const [slug, imageUrl] of Object.entries(catImageMap)) {
    await prisma.category.updateMany({
      where: { slug },
      data: { imageUrl },
    });
  }
  console.log("✓ Category images linked!");

  const suitCat = await prisma.category.findUnique({ where: { slug: "suits" } });
  const shirtCat = await prisma.category.findUnique({ where: { slug: "shirts" } });
  const trouserCat = await prisma.category.findUnique({ where: { slug: "trousers" } });
  const coatCat = await prisma.category.findUnique({ where: { slug: "outerwear" } });
  const knitCat = await prisma.category.findUnique({ where: { slug: "knitwear" } });
  const accCat = await prisma.category.findUnique({ where: { slug: "accessories" } });

  const productsData = [
    {
      slug: "classic-royal-suit",
      name: "بدلة كلاسيك فاخرة | Classic Royal Suit",
      description:
        "بدلة رجالية إيطالية فاخرة بتفصيل دقيق وقصة كلاسيكية عصرية تمنحك إطلالة ملكية في كافة المناسبات الرسمية والخاصة. مصنوعة من أرقى خامات الصوف الإيطالي الناعم مع تفاصيل ياقة متباينة ولمسات مذهبة تعكس فخامة علامة AVERO MUTAGIM.",
      careInstructions: "تنظيف جاف فقط (Dry Clean Only). يحفظ في كيس البدلة المخصص على علاقة عريضة.",
      categoryId: suitCat?.id,
      price: 0, // السعر قريبًا
      salePrice: null,
      status: "PUBLISHED" as const,
      isFeatured: true,
      isBestSeller: true,
      tags: ["بدل", "رجالي", "إيطالي", "رسمي", "فاخر"],
      colors: [
        { name: "أخضر زمردي ملكي", hex: "#0B4D3B" },
        { name: "أسود كلاسيك", hex: "#1A1A1A" },
      ],
      sizes: ["48", "50", "52", "54", "56"],
      images: [
        { url: "/products/classic-suit-1.webp", alt: "بدلة كلاسيك فاخرة - العرض الكامل", isCover: true },
        { url: "/products/classic-suit-2.webp", alt: "تفاصيل ياقة وخامة البدلة الفاخرة", isCover: false },
      ],
    },
    {
      slug: "premium-dress-shirt",
      name: "قميص إيطالي كلاسيك | Premium Dress Shirt",
      description:
        "قميص شبابي راقٍ مصنوع من أجود خامات القطن المصري والإيطالي بقصة سليم فيت محكمة وياقة كلاسيكية أنيقة وأزرار صدفية طبيعية. قطعة أساسية لا غنى عنها في خزانة كل رجل يبحث عن التميز.",
      careInstructions: "غسيل على درجة حرارة معتدلة (30°)، كوي بدرجة حرارة متوسطة للقطن.",
      categoryId: shirtCat?.id,
      price: 0, // السعر قريبًا
      salePrice: null,
      status: "PUBLISHED" as const,
      isFeatured: true,
      isBestSeller: true,
      tags: ["قمصان", "أبيض", "قطن", "إيطالي", "كلاسيك"],
      colors: [
        { name: "أبيض ناصع", hex: "#FFFFFF" },
        { name: "أزرق سماوي", hex: "#D6E4F0" },
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
      images: [
        { url: "/products/premium-shirt-1.webp", alt: "قميص إيطالي كلاسيك ناصع البياض", isCover: true },
        { url: "/products/premium-shirt-2.webp", alt: "تفاصيل ياقة وأزرار القميص", isCover: false },
      ],
    },
    {
      slug: "tailored-dress-trousers",
      name: "بنطال قماش إيطالي | Tailored Dress Trousers",
      description:
        "بنطال قماش شبابي فاخر بقصة عصرية متناسقة مع حزام أنيق، يجمع بين الراحة الفائقة والمظهر الرسمي الجذاب. خامة صوف ناعمة مضادة للتجعد مع كسرات حادة تعطي انسيابية وأناقة تدوم طوال اليوم.",
      careInstructions: "غسيل يدوي أو تنظيف جاف، كوي بالبخار على حرارة منخفضة.",
      categoryId: trouserCat?.id,
      price: 0, // السعر قريبًا
      salePrice: null,
      status: "PUBLISHED" as const,
      isFeatured: true,
      isBestSeller: true,
      tags: ["بناطيل", "قماش", "رسمي", "فحمي", "إيطالي"],
      colors: [
        { name: "رمادي فحمي", hex: "#383B3E" },
        { name: "أسود داكن", hex: "#151515" },
      ],
      sizes: ["30", "32", "34", "36", "38"],
      images: [
        { url: "/products/tailored-trousers-1.webp", alt: "بنطال قماش إيطالي بقصة عصرية متناسقة", isCover: true },
        { url: "/products/tailored-trousers-2.webp", alt: "تفاصيل الخياطة والكسرات والخصر", isCover: false },
      ],
    },
    {
      slug: "cashmere-wool-overcoat",
      name: "معطف صوف فاخر | Cashmere Wool Overcoat",
      description:
        "معطف رجالي شتوي راقٍ مبطن بخامات عازلة وتفاصيل أنيقة وياقة متميزة تمنح الدفء والهيبة في الأيام الباردة. لون جملي كلاسيكي جذاب يناسب التنسيق فوق البدل والملابس الكاجوال الراقية.",
      careInstructions: "تنظيف جاف حصراً. استخدم فرشاة الصوف الناعمة للعناية الدورية.",
      categoryId: coatCat?.id,
      price: 0, // السعر قريبًا
      salePrice: null,
      status: "PUBLISHED" as const,
      isFeatured: true,
      isBestSeller: true,
      tags: ["معاطف", "جاكيتات", "صوف", "كشمير", "شتوي", "جملي"],
      colors: [
        { name: "جملي كلاسيك", hex: "#C19A6B" },
        { name: "أسود فاحم", hex: "#1A1A1A" },
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
      images: [
        { url: "/products/cashmere-overcoat-1.webp", alt: "معطف صوف كشمير رجالي فاخر", isCover: true },
        { url: "/products/cashmere-overcoat-2.webp", alt: "تفاصيل قماش وقصة المعطف الشتوي", isCover: false },
      ],
    },
    {
      slug: "fine-cashmere-sweater",
      name: "كنزة كشمير راقية | Fine Cashmere Sweater",
      description:
        "كنزة شبابية مريحة بخامة كشمير صوفية ناعمة وياقة دائرية أنيقة، تمنحك مظهراً دافئاً وعصرياً لإطلالة يومية راقية تليق بأوقات العمل واللقاءات الخاصة.",
      careInstructions: "غسيل يدوي بماء بارد وشامبو صوف مخصص، تجفيف أفقي على سطح مستوٍ.",
      categoryId: knitCat?.id,
      price: 0, // السعر قريبًا
      salePrice: null,
      status: "PUBLISHED" as const,
      isFeatured: true,
      isBestSeller: true,
      tags: ["كنزات", "كشمير", "بيج", "صوف", "شتوي"],
      colors: [
        { name: "بيج كريمي", hex: "#EBE3D5" },
        { name: "رمادي هادئ", hex: "#A6A6A6" },
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
      images: [
        { url: "/products/knit-sweater-1.webp", alt: "كنزة كشمير ناعمة بلون كريمي هادئ", isCover: true },
        { url: "/products/knit-sweater-2.webp", alt: "تفاصيل النسيج والياقة الصوفية الفاخرة", isCover: false },
      ],
    },
    {
      slug: "royal-leather-set",
      name: "طقم حزام ومحفظة جلد طبيعي | Royal Leather Set",
      description:
        "طقم رجالي فاخر يتألف من حزام مصنوع يدوياً من أفخر أنواع الجلد الطبيعي الإيطالي عالي الجودة مع إبزيم معدني ذهبي لامع، ومحفظة كروت جلدية منقوشة تأتي داخل علبة هدايا خضراء زمردية فاخرة تحمل هوية AVERO MUTAGIM.",
      careInstructions: "مسح بقطعة قماش ناعمة وجافة، استخدام مرطب الجلد الطبيعي عند الحاجة.",
      categoryId: accCat?.id,
      price: 0, // السعر قريبًا
      salePrice: null,
      status: "PUBLISHED" as const,
      isFeatured: true,
      isBestSeller: true,
      tags: ["إكسسوارات", "حزام", "جلد طبيعي", "ذهبي", "محفظة"],
      colors: [
        { name: "أسود ملكي مع ذهبي", hex: "#1A1A1A" },
        { name: "بني دافئ مع ذهبي", hex: "#4A2E18" },
      ],
      sizes: ["95cm", "100cm", "105cm", "110cm", "115cm"],
      images: [
        { url: "/products/leather-belt-set-1.webp", alt: "طقم حزام جلد طبيعي بإبزيم ذهبي ومحفظة كروت", isCover: true },
        { url: "/products/leather-belt-set-2.webp", alt: "تفاصيل الإبزيم المذهب والجلد الطبيعي", isCover: false },
      ],
    },
  ];

  for (const p of productsData) {
    const { colors, sizes, images, ...base } = p;
    console.log(`Creating product: ${base.name}...`);
    const product = await prisma.product.create({
      data: {
        ...base,
        publishedAt: new Date(),
      },
    });

    // Create colors
    const createdColors = [];
    for (let cIdx = 0; cIdx < colors.length; cIdx++) {
      const c = colors[cIdx];
      const color = await prisma.productColor.create({
        data: {
          productId: product.id,
          name: c.name,
          hex: c.hex,
          sortOrder: cIdx,
        },
      });
      createdColors.push(color);
    }

    // Create images
    for (let iIdx = 0; iIdx < images.length; iIdx++) {
      const img = images[iIdx];
      await prisma.productImage.create({
        data: {
          productId: product.id,
          colorId: createdColors[0]?.id,
          url: img.url,
          alt: img.alt,
          isCover: img.isCover,
          sortOrder: iIdx,
        },
      });
    }

    // Create variants (sizes x primary color)
    for (const color of createdColors) {
      for (const size of sizes) {
        const sku = `${product.slug.slice(0, 4).toUpperCase()}-${color.name.slice(0, 2)}-${size}`.replace(/\s+/g, "");
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            colorId: color.id,
            size,
            sku,
            stock: 25,
            priceAdjustment: 0,
            isActive: true,
          },
        });

        await prisma.stockMovement.create({
          data: {
            variantId: variant.id,
            delta: 25,
            stockAfter: 25,
            reason: "INITIAL",
            note: "افتتاح تشكيلة AVERO MUTAGIM",
          },
        });
      }
    }
  }

  console.log("✓ All 6 luxury men's products seeded successfully into database!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
