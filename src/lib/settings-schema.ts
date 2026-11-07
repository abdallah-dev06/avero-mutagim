import { z } from "zod";

const link = z.object({ label: z.string().trim().min(1).max(40), href: z.string().trim().min(1).max(300) });

export const siteSettingsSchema = z.object({
  announcement: z.object({
    enabled: z.boolean(),
    messages: z.array(z.string().trim().min(1).max(120)).min(1).max(5),
  }),
  hero: z.object({
    eyebrow: z.string().trim().max(60),
    title: z.string().trim().min(1).max(80),
    subtitle: z.string().trim().max(240),
    primaryCta: link,
    secondaryCta: link,
    imageUrl: z.string().trim().max(500).nullable(),
    imageAlt: z.string().trim().max(160),
  }),
  business: z.object({
    name: z.string().trim().min(1).max(80),
    whatsappNumber: z.string().trim().max(20), // E.164
    instagramUrl: z.string().trim().max(300),
    facebookUrl: z.string().trim().max(300),
    email: z.string().trim().max(120),
    address: z.string().trim().max(200),
    hours: z.string().trim().max(120),
  }),
  shipping: z.object({
    fee: z.number().int().min(0).max(100000), // agorot
    message: z.string().trim().min(1).max(120),
    estimate: z.string().trim().max(120),
    returnsPolicy: z.string().trim().max(1000),
  }),
  homepage: z.object({
    showNewArrivals: z.boolean(),
    showBestSellers: z.boolean(),
    showCollections: z.boolean(),
    showTestimonials: z.boolean(),
    storyTitle: z.string().trim().max(80),
    storyText: z.string().trim().max(600),
  }),
  footer: z.object({
    about: z.string().trim().max(400),
  }),
  seo: z.object({
    title: z.string().trim().max(70),
    description: z.string().trim().max(170),
  }),
  inventory: z.object({
    defaultLowStockThreshold: z.number().int().min(0).max(1000),
  }),
  revenue: z.object({
    // Which orders count as "realised" revenue on the dashboard
    recognizeOn: z.enum(["DELIVERED", "PAID"]),
  }),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const DEFAULT_SETTINGS: SiteSettings = {
  announcement: {
    enabled: true,
    messages: ["توصيل مجاني لجميع أنحاء فلسطين", "الدفع عند الاستلام", "تشكيلة جديدة كل أسبوع"],
  },
  hero: {
    eyebrow: "VETRINA · مجموعة الموسم",
    title: "أناقةٌ تُروى بهدوء",
    subtitle: "قطع مختارة بعناية للمرأة التي ترى في البساطة فخامة — عبايات، بلوزات، وأطقم بتفاصيل راقية.",
    primaryCta: { label: "تسوّقي الجديد", href: "/shop?sort=new" },
    secondaryCta: { label: "اكتشفي الأقسام", href: "/categories" },
    imageUrl: null,
    imageAlt: "",
  },
  business: {
    name: "VETRINA BOUTIQUE",
    whatsappNumber: "+970599571202",
    instagramUrl: "https://www.instagram.com/vetrina__boutique",
    facebookUrl: "https://www.facebook.com/share/1CFbD8EAG2/",
    email: "",
    address: "فلسطين (32°13'26.3\"N 35°13'12.6\"E)",
    hours: "أحد، اثنين، أربعاء: 3:00 عصراً – 8:00 مساءً | باقي الأيام: جميع الأوقات",
  },
  shipping: {
    fee: 0,
    message: "توصيل مجاني لجميع أنحاء فلسطين",
    estimate: "يصلك الطلب عادةً خلال 2 – 4 أيام عمل",
    returnsPolicy: "يمكن استبدال القطعة خلال 3 أيام من الاستلام بشرط أن تكون بحالتها الأصلية مع الملصقات. تواصلي معنا عبر واتساب لترتيب الاستبدال.",
  },
  homepage: {
    showNewArrivals: true,
    showBestSellers: true,
    showCollections: true,
    showTestimonials: true,
    storyTitle: "واجهة تعكس ذوقك",
    storyText: "«فيترينا» تعني الواجهة. نختار كل قطعة كما لو كانت ستُعرض في واجهة بوتيك راقٍ: قماش يُحسّ، قصّة مدروسة، وألوان هادئة تدوم أكثر من موسم.",
  },
  footer: {
    about: "بوتيك أزياء نسائية من فلسطين. نؤمن أن الأناقة الحقيقية هادئة، مريحة، وتشبهك.",
  },
  seo: {
    title: "VETRINA BOUTIQUE | فيترينا بوتيك",
    description: "متجر أزياء نسائية راقية في فلسطين: عبايات، بلوزات، بناطيل، شالات وأطقم. توصيل مجاني لجميع أنحاء فلسطين والدفع عند الاستلام.",
  },
  inventory: { defaultLowStockThreshold: 3 },
  revenue: { recognizeOn: "DELIVERED" },
};
