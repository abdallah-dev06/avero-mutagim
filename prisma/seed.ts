/**
 * Non-destructive seed. Safe to run repeatedly:
 *  - creates missing reference data (cities, size chart, categories, templates, settings)
 *  - inserts DEMO products only when they don't exist yet (isDemo = true, clearly labelled)
 *  - never deletes or overwrites merchant data.
 * Set SEED_DEMO_PRODUCTS=false to skip demo products.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/settings-schema";
import { DEFAULT_WHATSAPP_TEMPLATES } from "../src/lib/whatsapp";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const CITIES: Record<string, string[]> = {
  "القدس": ["البلدة القديمة", "بيت حنينا", "شعفاط", "العيزرية", "أبو ديس", "الرام", "سلوان", "جبل المكبر"],
  "رام الله والبيرة": ["رام الله - المركز", "البيرة", "بيتونيا", "الماصيون", "الطيرة", "سردا", "بيرزيت", "سلواد"],
  "نابلس": ["المركز", "رفيديا", "المخفية", "الضاحية", "بلاطة", "عسكر", "حوارة", "بيتا"],
  "الخليل": ["المركز", "عين سارة", "الحاووز", "دورا", "حلحول", "يطا", "بني نعيم", "بيت أمر"],
  "بيت لحم": ["المركز", "بيت جالا", "بيت ساحور", "الخضر", "الدوحة", "العبيدية"],
  "جنين": ["المركز", "قباطية", "يعبد", "عرابة", "برقين", "اليامون"],
  "طولكرم": ["المركز", "عنبتا", "بلعا", "قفين", "دير الغصون"],
  "قلقيلية": ["المركز", "عزون", "حبلة", "جيوس"],
  "سلفيت": ["المركز", "بديا", "كفل حارس", "دير استيا"],
  "طوباس": ["المركز", "طمون", "عقابا"],
  "أريحا والأغوار": ["المركز", "العوجا", "النويعمة"],
  "الداخل المحتل (48)": ["الناصرة", "أم الفحم", "الطيبة", "حيفا", "يافا", "عكا", "رهط", "سخنين"],
  "غزة": ["مدينة غزة", "جباليا", "بيت لاهيا"],
  "خانيونس": ["المركز", "بني سهيلا"],
  "دير البلح": ["المركز", "النصيرات", "الزوايدة"],
  "رفح": ["المركز"],
};
// Gaza Strip delivery depends on current courier coverage — seeded inactive; enable from admin when available.
const INACTIVE_BY_DEFAULT = new Set(["غزة", "خانيونس", "دير البلح", "رفح"]);

const SIZE_ROWS = [
  ["XS", "36", 87, 68, 94],
  ["S", "38", 92, 72, 99],
  ["M", "40", 97, 77, 103],
  ["M", "42", 102, 82, 108],
  ["L", "44", 107, 88, 112],
  ["L", "46", 113, 94, 117],
  ["XL", "48", 119, 102, 123],
  ["XL", "50", 125, 108, 129],
  ["XXL", "52", 131, 114, 135],
  ["3XL", "54", 137, 120, 141],
  ["3XL", "56", 143, 126, 147],
] as const;

const CATEGORIES = [
  { slug: "abayas", name: "عبايات", nameEn: "Abayas", kind: "abaya", description: "عبايات بقصّات انسيابية وأقمشة مختارة." },
  { slug: "blouses", name: "بلوزات", nameEn: "Blouses", kind: "blouse", description: "بلوزات ناعمة لإطلالات يومية وراقية." },
  { slug: "trousers", name: "بناطيل", nameEn: "Trousers", kind: "trousers", description: "بناطيل مريحة بقصّات عصرية." },
  { slug: "scarves", name: "شالات", nameEn: "Scarves", kind: "scarf", description: "شالات حرير وشيفون بألوان هادئة." },
  { slug: "sets", name: "أطقم", nameEn: "Sets", kind: "set", description: "أطقم متناسقة جاهزة لكل مناسبة." },
];

const C = {
  black: { name: "أسود ليلي", hex: "#1F1A1C" },
  burgundy: { name: "عنابي", hex: "#6B2238" },
  sand: { name: "بيج رملي", hex: "#CDB49A" },
  rose: { name: "وردي غباري", hex: "#D9A6B6" },
  olive: { name: "زيتي", hex: "#5E6B4E" },
  navy: { name: "كحلي", hex: "#22304A" },
  ivory: { name: "عاجي", hex: "#EFE8DF" },
  mocha: { name: "موكا", hex: "#7A5A4A" },
} as const;
type ColorKey = keyof typeof C;

type DemoProduct = {
  slug: string;
  name: string;
  category: string;
  kind: string;
  price: number;
  salePrice?: number;
  colors: ColorKey[];
  sizes: string[];
  featured?: boolean;
  best?: boolean;
  collections: string[];
  description: string;
  care: string;
};

const CARE_DEFAULT = "غسيل يدوي أو دورة لطيفة بماء بارد.\nلا تستخدمي المبيّض.\nكيّ على حرارة منخفضة من الداخل.\nيُجفف بعيداً عن الشمس المباشرة.";
const LETTER_SIZES = ["S", "M", "L", "XL", "XXL"];

const PRODUCTS: DemoProduct[] = [
  { slug: "demo-flowing-crepe-abaya", name: "عباية كريب انسيابية", category: "abayas", kind: "abaya", price: 18900, colors: ["black", "mocha", "navy"], sizes: LETTER_SIZES, featured: true, best: true, collections: ["autumn-edit"], description: "عباية بقصّة مستقيمة انسيابية من قماش الكريب المطفي، بأكمام واسعة قليلاً وياقة دائرية ناعمة. تناسب الإطلالات اليومية والمناسبات الهادئة.", care: CARE_DEFAULT },
  { slug: "demo-linen-wide-sleeve-abaya", name: "عباية كتان بأكمام واسعة", category: "abayas", kind: "abaya", price: 21900, salePrice: 17900, colors: ["sand", "olive"], sizes: ["S", "M", "L", "XL"], featured: true, collections: ["autumn-edit"], description: "عباية من مزيج الكتان الخفيف بأكمام واسعة وتفاصيل خياطة بارزة. مريحة للأيام الدافئة.", care: CARE_DEFAULT },
  { slug: "demo-satin-soft-collar-blouse", name: "بلوزة ساتان بياقة ناعمة", category: "blouses", kind: "blouse", price: 11900, colors: ["rose", "ivory", "burgundy"], sizes: ["XS", "S", "M", "L", "XL"], best: true, collections: ["daily-essentials"], description: "بلوزة ساتان بلمعة هادئة وأزرار أمامية، بقصّة مريحة تنسدل بأناقة.", care: CARE_DEFAULT },
  { slug: "demo-pleated-chiffon-blouse", name: "بلوزة شيفون بكسرات", category: "blouses", kind: "blouse", price: 9900, colors: ["ivory", "black"], sizes: ["S", "M", "L"], collections: ["daily-essentials"], description: "بلوزة شيفون ببطانة داخلية وكسرات دقيقة على الصدر.", care: CARE_DEFAULT },
  { slug: "demo-high-waist-wide-trousers", name: "بنطال واسع بخصر عالٍ", category: "trousers", kind: "trousers", price: 12900, colors: ["sand", "black", "navy"], sizes: ["S", "M", "L", "XL", "XXL"], best: true, featured: true, collections: ["daily-essentials"], description: "بنطال واسع بخصر عالٍ وكسرات أمامية، يمنح طولاً وانسيابية.", care: CARE_DEFAULT },
  { slug: "demo-straight-crepe-trousers", name: "بنطال كريب مستقيم", category: "trousers", kind: "trousers", price: 11900, salePrice: 9900, colors: ["mocha", "olive"], sizes: ["S", "M", "L", "XL"], collections: ["autumn-edit"], description: "بنطال كريب بقصّة مستقيمة وخصر مطاطي من الخلف لراحة يومية.", care: CARE_DEFAULT },
  { slug: "demo-soft-silk-scarf", name: "شال حرير ناعم", category: "scarves", kind: "scarf", price: 4900, colors: ["rose", "sand", "burgundy", "black"], sizes: ["ONE SIZE"], best: true, collections: ["daily-essentials"], description: "شال بملمس حريري ناعم وثبات ممتاز، بمقاس 180 × 70 سم.", care: "غسيل يدوي بماء بارد.\nكيّ على حرارة منخفضة جداً." },
  { slug: "demo-matte-chiffon-scarf", name: "شال شيفون مطفي", category: "scarves", kind: "scarf", price: 3900, colors: ["ivory", "mocha", "navy"], sizes: ["ONE SIZE"], collections: ["daily-essentials"], description: "شال شيفون مطفي خفيف لا ينزلق، مثالي للاستخدام اليومي.", care: "غسيل يدوي بماء بارد.\nيُجفف مفروداً." },
  { slug: "demo-blouse-trousers-set", name: "طقم بلوزة وبنطال", category: "sets", kind: "set", price: 25900, colors: ["burgundy", "sand"], sizes: ["S", "M", "L", "XL"], featured: true, collections: ["autumn-edit"], description: "طقم متناسق من بلوزة واسعة وبنطال مستقيم من نفس القماش.", care: CARE_DEFAULT },
  { slug: "demo-summer-linen-set", name: "طقم كتان صيفي", category: "sets", kind: "set", price: 23900, colors: ["olive", "ivory"], sizes: ["S", "M", "L"], collections: ["daily-essentials"], description: "طقم كتان خفيف بقصّة مريحة، مثالي للسفر والنزهات.", care: CARE_DEFAULT },
];

// Deterministic pseudo-random stock so the demo shows in-stock, low-stock and sold-out states.
function demoStock(i: number, j: number, k: number) {
  const n = (i * 7 + j * 5 + k * 3) % 11;
  if (n === 0) return 0;
  if (n === 1) return 1;
  if (n === 2) return 2;
  return n + 2;
}

async function main() {
  // Settings (create only)
  await prisma.setting.upsert({ where: { key: "site" }, create: { key: "site", value: DEFAULT_SETTINGS }, update: {} });

  // WhatsApp templates (create only)
  for (const [status, body] of Object.entries(DEFAULT_WHATSAPP_TEMPLATES)) {
    await prisma.whatsAppTemplate.upsert({ where: { status: status as never }, create: { status: status as never, body }, update: {} });
  }

  // Cities & areas (create missing only)
  let ci = 0;
  for (const [city, areas] of Object.entries(CITIES)) {
    const c = await prisma.city.upsert({
      where: { name: city },
      create: { name: city, sortOrder: ci++, isActive: !INACTIVE_BY_DEFAULT.has(city) },
      update: {},
    });
    let ai = 0;
    for (const area of [...areas, "منطقة أخرى"]) {
      await prisma.area.upsert({ where: { cityId_name: { cityId: c.id, name: area } }, create: { cityId: c.id, name: area, sortOrder: ai++ }, update: {} });
    }
  }

  // Default size chart
  let chart = await prisma.sizeChart.findFirst({ where: { isDefault: true } });
  if (!chart) {
    chart = await prisma.sizeChart.create({
      data: {
        name: "دليل المقاسات الأوروبي",
        description: "قيم أولية مأخوذة من جدول مرجعي — يجب أن يؤكدها المتجر قبل اعتمادها رسمياً. القياسات بالسنتيمتر وهي قياسات الجسم وليست قياسات القطعة.",
        measurementType: "BODY",
        isDefault: true,
        rows: { create: SIZE_ROWS.map(([label, eu, bust, waist, hips], i) => ({ label, euSize: eu, bustCm: bust, waistCm: waist, hipsCm: hips, sortOrder: i })) },
      },
    });
  }

  // Categories (create missing only)
  const catIds: Record<string, string> = {};
  for (const [i, cat] of CATEGORIES.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: { slug: cat.slug, name: cat.name, nameEn: cat.nameEn, description: cat.description, imageUrl: `/demo/category-${cat.kind}.webp`, sortOrder: i },
      update: {},
    });
    catIds[cat.slug] = row.id;
  }

  // Collections
  const collections = [
    { slug: "autumn-edit", name: "مختارات الخريف", nameEn: "The Autumn Edit", description: "ألوان دافئة وأقمشة بملمس غني.", imageUrl: "/demo/abaya-mocha-1.webp" },
    { slug: "daily-essentials", name: "أساسيات يومية", nameEn: "Daily Essentials", description: "قطع أساسية تُنسّق بسهولة كل يوم.", imageUrl: "/demo/blouse-rose-1.webp" },
  ];
  for (const [i, col] of collections.entries()) {
    await prisma.collection.upsert({ where: { slug: col.slug }, create: { ...col, sortOrder: i }, update: {} });
  }

  if (process.env.SEED_DEMO_PRODUCTS === "false") return;

  for (const [i, p] of PRODUCTS.entries()) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (exists) continue;
    await prisma.$transaction(
      async (tx) => {
        const product = await tx.product.create({
        data: {
          slug: p.slug,
          name: p.name,
          description: p.description,
          careInstructions: p.care,
          categoryId: catIds[p.category],
          price: p.price,
          salePrice: p.salePrice ?? null,
          status: "PUBLISHED",
          isFeatured: !!p.featured,
          isBestSeller: !!p.best,
          tags: ["تجريبي", "demo"],
          isDemo: true,
          publishedAt: new Date(Date.now() - i * 864e5),
          createdAt: new Date(Date.now() - i * 864e5),
          seoDescription: p.description.slice(0, 150),
          collections: { connect: p.collections.map((slug) => ({ slug })) },
        },
      });
      for (const [j, key] of p.colors.entries()) {
        const color = await tx.productColor.create({ data: { productId: product.id, name: C[key].name, hex: C[key].hex, sortOrder: j } });
        await tx.productImage.createMany({
          data: [1, 2].map((n) => ({
            productId: product.id,
            colorId: color.id,
            url: `/demo/${p.kind}-${key}-${n}.webp`,
            alt: `${p.name} — ${C[key].name} (صورة توضيحية)`,
            width: 900,
            height: 1200,
            sortOrder: j * 10 + n,
            isCover: j === 0 && n === 1,
          })),
        });
        for (const [k, size] of p.sizes.entries()) {
          const stock = demoStock(i, j, k);
          const v = await tx.productVariant.create({
            data: {
              productId: product.id,
              colorId: color.id,
              size,
              sku: `DEMO-${String(i + 1).padStart(2, "0")}-${key.slice(0, 3).toUpperCase()}-${size.replace(/\s/g, "")}`,
              stock,
            },
          });
          await tx.stockMovement.create({ data: { variantId: v.id, delta: stock, stockAfter: stock, reason: "INITIAL", note: "Demo seed" } });
        }
      }
    }, { timeout: 60000, maxWait: 15000 });
  }
  console.log("Seed complete (non-destructive).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
