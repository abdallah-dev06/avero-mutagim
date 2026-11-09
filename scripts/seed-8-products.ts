import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const USER_UPLOADED_DIR = "C:/Users/AbdullahY/.gemini/antigravity/brain/ea6ebf3a-b71c-4dbb-976f-f5d65a31620f/.user_uploaded";
const PUBLIC_PRODUCTS_DIR = path.resolve(process.cwd(), "public/products");

async function processAndStoreImage(filename: string, outputSlug: string, index: number) {
  const inputPath = path.join(USER_UPLOADED_DIR, filename);
  const outputFileName = `${outputSlug}-${index}.webp`;
  const outputPath = path.join(PUBLIC_PRODUCTS_DIR, outputFileName);
  const mediaKey = `products/${outputFileName}`;

  const imageBuffer = await fs.readFile(inputPath);
  const pipeline = sharp(imageBuffer).resize({
    width: 1600,
    height: 2000,
    fit: "inside",
    withoutEnlargement: true,
  });

  const metadata = await pipeline.metadata();
  const webpBuffer = await pipeline.webp({ quality: 88 }).toBuffer();

  // Save to public filesystem
  await fs.writeFile(outputPath, webpBuffer);

  // Save permanently to Neon database StoredMedia table
  await prisma.storedMedia.upsert({
    where: { key: mediaKey },
    create: {
      key: mediaKey,
      mimeType: "image/webp",
      data: webpBuffer,
      width: metadata.width || 1200,
      height: metadata.height || 1500,
    },
    update: {
      data: webpBuffer,
      width: metadata.width || 1200,
      height: metadata.height || 1500,
    },
  });

  console.log(`✓ Processed and saved: ${outputFileName} (${webpBuffer.length} bytes)`);
  return {
    url: `/products/${outputFileName}`,
    storageKey: mediaKey,
    width: metadata.width || 1200,
    height: metadata.height || 1500,
  };
}

async function main() {
  console.log("Starting seed of 8 luxury products into Neon DB...");
  await fs.mkdir(PUBLIC_PRODUCTS_DIR, { recursive: true });

  // 1. Get default size chart
  const defaultChart = await prisma.sizeChart.findFirst({
    where: { isDefault: true },
  });
  const chartId = defaultChart?.id;
  console.log(`Using SizeChart: ${defaultChart?.name} (${chartId})`);

  // 2. Ensure Categories Exist & Are Named Properly
  const categoriesDef = [
    {
      slug: "coats",
      name: "المعاطف والجاكيتات",
      nameEn: "Coats & Jackets",
      description: "تشكيلة معاطف وجاكيتات شتوية فاخرة تجمع بين الدفء والأناقة الملكية",
      sortOrder: 1,
      sizeChartId: chartId,
    },
    {
      slug: "abayas",
      name: "العبايات والأطقم",
      nameEn: "Abayas & Sets",
      description: "عبايات وأطقم راقية بتصاميم عصرية وأقمشة منسدلة فاخرة",
      sortOrder: 2,
      sizeChartId: chartId,
    },
    {
      slug: "blouses",
      name: "البلوزات والكنزات",
      nameEn: "Blouses & Tops",
      description: "بلايز وكنزات أنثوية أنيقة بقصات عصرية وتفاصيل استثنائية",
      sortOrder: 3,
      sizeChartId: chartId,
    },
  ];

  const categoryMap: Record<string, string> = {};

  for (const cat of categoriesDef) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: {
        slug: cat.slug,
        name: cat.name,
        nameEn: cat.nameEn,
        description: cat.description,
        sortOrder: cat.sortOrder,
        isActive: true,
        isFeatured: true,
        sizeChartId: cat.sizeChartId,
      },
      update: {
        name: cat.name,
        nameEn: cat.nameEn,
        description: cat.description,
        sortOrder: cat.sortOrder,
        isActive: true,
        isFeatured: true,
        sizeChartId: cat.sizeChartId,
      },
    });
    categoryMap[cat.slug] = record.id;
    console.log(`✓ Category: ${record.name} (${record.slug}) -> ${record.id}`);
  }

  // 3. Define the 8 Products
  const productsDef = [
    {
      slug: "royal-winter-coat",
      name: "معطف الشتاء الملكي | Royal Winter Coat",
      description: "إطلالة شتوية تجمع بين الدفء والأناقة بتصميم طويل وراقٍ، مع ياقة فرو ناعمة وتفاصيل مبطنة تضيف لمسة من الفخامة. قطعة مميزة لإطلالات الشتاء اليومية والرسمية.",
      careInstructions: "تنظيف جاف فقط للحفاظ على جودة الفرو وبطانة المعطف الفاخرة.",
      categorySlug: "coats",
      color: { name: "أسود ملكي", hex: "#1A1A1A" },
      imageFiles: [
        "media_1794184762989_adff6cce.jpg",
        "media_1794184657970_0cb240fd.jpg",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      slug: "mauve-elegance-set",
      name: "طقم موف إليجانس | Mauve Elegance Set",
      description: "تصميم أنثوي أنيق بلون موف راقٍ، يتميز بقصة طويلة وانسيابية وتفاصيل أزرار ذهبية ولمسات هندسية ناعمة. اختيار مناسب لإطلالة محتشمة تجمع بين البساطة والرقي.",
      careInstructions: "غسيل يدوي أو تنظيف جاف بدرجة حرارة باردة، الكي بالبخار برفق.",
      categorySlug: "abayas",
      color: { name: "موف هادئ", hex: "#7A6678" },
      imageFiles: [
        "media_1794184762996_d948157a.jpg",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      slug: "grey-elegance-set",
      name: "طقم جراي إليجانس | Grey Elegance Set",
      description: "إطلالة هادئة بلون رمادي عصري وتصميم طويل وانسيابي، مع تفاصيل دقيقة تمنح القطعة لمسة راقية. خيار أنيق للتنسيقات اليومية والمناسبات البسيطة.",
      careInstructions: "غسيل يدوي أو دورة أقمشة ناعمة بدرجة 30 مئوية، لا تستخدمي المبيضات.",
      categorySlug: "abayas",
      color: { name: "رمادي عصري", hex: "#616975" },
      imageFiles: [
        "media_1794184762983_dcbab534.jpg",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      slug: "black-elegance-set",
      name: "طقم بلاك إليجانس | Black Elegance Set",
      description: "أناقة الأسود الكلاسيكي بتصميم طويل ومرتب، تتكامل معه الأزرار الذهبية والتفاصيل الهادئة لتمنحكِ إطلالة أنيقة ومميزة.",
      careInstructions: "غسيل ناعم للحفاظ على بريق اللون الأسود والأزرار الذهبية، كي خفيف على الظهر.",
      categorySlug: "abayas",
      color: { name: "أسود كلاسيكي", hex: "#1C1C1E" },
      imageFiles: [
        "media_1794184786653_0865e951.jpg",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      slug: "grey-chic-blouse",
      name: "بلوزة جراي شيك | Grey Chic Blouse",
      description: "بلوزة رمادية بتصميم عصري وياقة V محددة بالأسود، مع لمسة زخرفية أنيقة على الصدر. قطعة مناسبة لإطلالات يومية عملية بتفاصيل مميزة.",
      careInstructions: "غسيل لطيف بالماء البارد والكي بالبخار على حرارة منخفضة.",
      categorySlug: "blouses",
      color: { name: "رمادي متوسط", hex: "#75787B" },
      imageFiles: [
        "media_1794184786742_7346c1f7.jpg",
        "media_1794184610343_98a7039a.jpg",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      slug: "silver-touch-blouse",
      name: "بلوزة سيلفر تاتش | Silver Touch Blouse",
      description: "تصميم ناعم بلون رمادي فاتح، يتميز بياقة V ولمسات لامعة تضيف لمسة من الرقي دون مبالغة. مثالية لتنسيق إطلالة أنثوية هادئة.",
      careInstructions: "غسيل مقلوب يدوياً لحماية التطريز الكريستالي اللامع.",
      categorySlug: "blouses",
      color: { name: "رمادي فاتح فضي", hex: "#9E9E9C" },
      imageFiles: [
        "media_1794184786753_4123a7fe.jpg",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      slug: "black-dots-blouse",
      name: "بلوزة بلاك دوتس | Black Dots Blouse",
      description: "بلوزة سوداء بتفاصيل منقطة وخامة ذات مظهر مزخرف، تمنح الإطلالة طابعًا أنيقًا ومميزًا. تصميم يجمع بين الكلاسيكية واللمسات العصرية.",
      careInstructions: "غسيل يدوي بماء بارد لحماية قماش الشيفون والدانتيل المنقط.",
      categorySlug: "blouses",
      color: { name: "أسود منقط", hex: "#1E1E20" },
      imageFiles: [
        "media_1794184786674_5eebefac.jpg",
        "media_1794184646498_a565b2dc.jpg",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      slug: "ivory-chic-blouse",
      name: "بلوزة آيفوري شيك | Ivory Chic Blouse",
      description: "بلوزة بلون كريمي هادئ، تتميز بياقة V وحواف سوداء متباينة تضفي طابعًا عصريًا وأنيقًا. مناسبة للتنسيق مع البناطيل والتنانير بمختلف الألوان.",
      careInstructions: "غسيل لطيف منفصل للألوان الفاتحة مع الكي بحرارة منخفضة.",
      categorySlug: "blouses",
      color: { name: "كريمي عاجي", hex: "#F2EBE1" },
      imageFiles: [
        "media_1794184763074_4f30d0e0.jpg",
        "media_1794184637173_8ae3ab9c.jpg",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
  ];

  for (const p of productsDef) {
    const catId = categoryMap[p.categorySlug];
    console.log(`\nProcessing product: ${p.name}...`);

    // Process images
    const processedImages = [];
    for (let i = 0; i < p.imageFiles.length; i++) {
      const img = await processAndStoreImage(p.imageFiles[i], p.slug, i + 1);
      processedImages.push({
        url: img.url,
        storageKey: img.storageKey,
        alt: p.name,
        width: img.width,
        height: img.height,
        sortOrder: i,
        isCover: i === 0,
      });
    }

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
      include: { colors: true, variants: true, images: true },
    });

    let productId: string;

    if (existing) {
      console.log(`Product ${p.slug} already exists. Updating...`);
      // Update core product info (Strictly 0 price per requirement)
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: p.name,
          description: p.description,
          careInstructions: p.careInstructions,
          price: 0,
          salePrice: null,
          status: "PUBLISHED",
          isFeatured: true,
          isBestSeller: true,
          isDemo: false,
          categoryId: catId,
          sizeChartId: chartId,
          publishedAt: new Date(),
        },
      });
      productId = updated.id;

      // Delete old relations to cleanly recreate
      await prisma.productImage.deleteMany({ where: { productId } });
      await prisma.productVariant.deleteMany({ where: { productId } });
      await prisma.productColor.deleteMany({ where: { productId } });
    } else {
      const created = await prisma.product.create({
        data: {
          slug: p.slug,
          name: p.name,
          description: p.description,
          careInstructions: p.careInstructions,
          price: 0,
          salePrice: null,
          status: "PUBLISHED",
          isFeatured: true,
          isBestSeller: true,
          isDemo: false,
          categoryId: catId,
          sizeChartId: chartId,
          publishedAt: new Date(),
        },
      });
      productId = created.id;
    }

    // Create Color
    const color = await prisma.productColor.create({
      data: {
        productId,
        name: p.color.name,
        hex: p.color.hex,
        sortOrder: 0,
      },
    });

    // Create Images
    for (const img of processedImages) {
      await prisma.productImage.create({
        data: {
          productId,
          colorId: color.id,
          url: img.url,
          storageKey: img.storageKey,
          alt: img.alt,
          width: img.width,
          height: img.height,
          sortOrder: img.sortOrder,
          isCover: img.isCover,
        },
      });
    }

    // Create Variants (Sizes: S, M, L, XL, XXL) with stock 5 each
    for (const size of p.sizes) {
      const sku = `${p.slug.toUpperCase()}-${size}`;
      await prisma.productVariant.create({
        data: {
          productId,
          colorId: color.id,
          size,
          sku,
          stock: 5,
          priceAdjustment: 0,
          isActive: true,
        },
      });
    }

    console.log(`✓ Product saved successfully: ${p.name} (ID: ${productId})`);
  }

  // Also update category cover images to use the first product of that category
  await prisma.category.update({
    where: { slug: "coats" },
    data: { imageUrl: "/products/royal-winter-coat-1.webp" },
  });
  await prisma.category.update({
    where: { slug: "abayas" },
    data: { imageUrl: "/products/mauve-elegance-set-1.webp" },
  });
  await prisma.category.update({
    where: { slug: "blouses" },
    data: { imageUrl: "/products/grey-chic-blouse-1.webp" },
  });

  console.log("\nAll 8 products seeded into database and filesystem successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding products:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
