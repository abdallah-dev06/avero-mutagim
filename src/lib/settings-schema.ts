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
    fee: z.number().int().min(0).max(100000), // agorot - West Bank & Jerusalem
    inside48Fee: z.number().int().min(0).max(100000).default(3000), // agorot - Inside 48 (30 NIS)
    message: z.string().trim().min(1).max(120),
    inside48Message: z.string().trim().max(120).default("توصيل مناطق الداخل بـ 30 ₪ (نصف السعر)"),
    estimate: z.string().trim().max(120),
    returnsPolicy: z.string().trim().max(1000),
  }),
  homepage: z.object({
    showNewArrivals: z.boolean(),
    showBestSellers: z.boolean(),
    showCollections: z.boolean(),
    showTestimonials: z.boolean(),
    showStory: z.boolean().default(true),
    showLocation: z.boolean().default(true),
    storyTitle: z.string().trim().max(80),
    storyText: z.string().trim().max(600),
  }),
  story: z
    .object({
      enabled: z.boolean().default(true),
      eyebrow: z.string().trim().max(60).default("OUR STORY"),
      title: z.string().trim().max(120).default("حكاية أناقة تبدأ بكِ"),
      subtitle: z.string().trim().max(160).default("لأن الأناقة تبدأ من التفاصيل..."),
      homeIntro: z.string().trim().max(800).default(
        "في VETRINA BOUTIQUE، نؤمن أن الأناقة ليست مجرد ملابس نرتديها، بل أسلوب يعبّر عن شخصيتنا وثقة ترافقنا في كل خطوة. نختار لكِ تصاميم تجمع بين الرقي والبساطة والراحة، لتجدي ما يشبه ذوقكِ ويعبّر عنكِ."
      ),
      fullStory: z.string().trim().max(3000).default(
        "نؤمن في VETRINA BOUTIQUE أن الأناقة ليست مجرد ملابس نرتديها، بل أسلوب يعبّر عن شخصيتنا، وثقة ترافقنا في كل خطوة.\n\nمن هنا جاءت فكرة فيترينا بوتيك؛ لنقدّم لكِ عالمًا يجمع بين الرقي والبساطة والراحة، حيث تلتقي التصاميم العصرية بالذوق الأنثوي الأصيل.\n\nنسعى إلى اختيار قطع مميزة تناسب تفاصيل يومكِ المختلفة، من إطلالاتكِ اليومية الهادئة إلى مناسباتكِ الخاصة، لتجدي دائمًا ما يشبه ذوقكِ ويعبّر عنكِ.\n\nنهتم بالتفاصيل الصغيرة التي تصنع الفرق، من تنوّع التصاميم والألوان إلى سهولة التسوق وتجربة الطلب.\n\nولأن الأناقة تستحق أن تصل إلى كل مكان، نوفّر لكِ توصيلًا مميزاً (توصيل مجاني للضفة والقدس · وللداخل بنصف السعر بـ 30 ₪).\n\nفي VETRINA BOUTIQUE، لا نريد أن نكون مجرد متجر للملابس، بل وجهتكِ المفضلة لاكتشاف إطلالتكِ القادمة."
      ),
      quote: z.string().trim().max(200).default("أناقتكِ... بأسلوب يشبهكِ."),
      imageUrl: z.string().trim().max(500).nullable().default(null),
      imageAlt: z.string().trim().max(160).default("VETRINA BOUTIQUE Editorial"),
    })
    .default({
      enabled: true,
      eyebrow: "OUR STORY",
      title: "حكاية أناقة تبدأ بكِ",
      subtitle: "لأن الأناقة تبدأ من التفاصيل...",
      homeIntro:
        "في VETRINA BOUTIQUE، نؤمن أن الأناقة ليست مجرد ملابس نرتديها، بل أسلوب يعبّر عن شخصيتنا وثقة ترافقنا في كل خطوة. نختار لكِ تصاميم تجمع بين الرقي والبساطة والراحة، لتجدي ما يشبه ذوقكِ ويعبّر عنكِ.",
      fullStory:
        "نؤمن في VETRINA BOUTIQUE أن الأناقة ليست مجرد ملابس نرتديها، بل أسلوب يعبّر عن شخصيتنا، وثقة ترافقنا في كل خطوة.\n\nمن هنا جاءت فكرة فيترينا بوتيك؛ لنقدّم لكِ عالمًا يجمع بين الرقي والبساطة والراحة، حيث تلتقي التصاميم العصرية بالذوق الأنثوي الأصيل.\n\nنسعى إلى اختيار قطع مميزة تناسب تفاصيل يومكِ المختلفة، من إطلالاتكِ اليومية الهادئة إلى مناسباتكِ الخاصة، لتجدي دائمًا ما يشبه ذوقكِ ويعبّر عنكِ.\n\nنهتم بالتفاصيل الصغيرة التي تصنع الفرق، من تنوّع التصاميم والألوان إلى سهولة التسوق وتجربة الطلب.\n\nولأن الأناقة تستحق أن تصل إلى كل مكان، نوفّر لكِ توصيلًا مميزاً (توصيل مجاني للضفة والقدس · وللداخل بنصف السعر بـ 30 ₪).\n\nفي VETRINA BOUTIQUE، لا نريد أن نكون مجرد متجر للملابس، بل وجهتكِ المفضلة لاكتشاف إطلالتكِ القادمة.",
      quote: "أناقتكِ... بأسلوب يشبهكِ.",
      imageUrl: null,
      imageAlt: "VETRINA BOUTIQUE Editorial",
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
    recognizeOn: z.enum(["DELIVERED", "PAID"]),
  }),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const DEFAULT_SETTINGS: SiteSettings = {
  announcement: {
    enabled: true,
    messages: [
      "توصيل مجاني للضفة والقدس · وللداخل بـ 30 ₪",
      "الدفع عند الاستلام",
      "تشكيلة جديدة كل أسبوع",
    ],
  },
  hero: {
    eyebrow: "VETRINA · مجموعة الموسم",
    title: "أناقةٌ تُروى بهدوء",
    subtitle: "قطع مختارة بعناية للمرأة التي ترى في البساطة فخامة — عبايات، بلايز، وأطقم بتفاصيل راقية.",
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
    inside48Fee: 3000,
    message: "توصيل مجاني للضفة والقدس · ومناطق الداخل بنصف السعر بـ 30 ₪",
    inside48Message: "توصيل مناطق الداخل بـ 30 ₪ (نصف السعر)",
    estimate: "يصلك الطلب عادةً خلال 2 – 4 أيام عمل",
    returnsPolicy: "يمكن استبدال القطعة خلال 3 أيام من الاستلام بشرط أن تكون بحالتها الأصلية مع الملصقات. تواصلي معنا عبر واتساب لترتيب الاستبدال.",
  },
  homepage: {
    showNewArrivals: true,
    showBestSellers: true,
    showCollections: true,
    showTestimonials: true,
    showStory: true,
    showLocation: true,
    storyTitle: "حكاية أناقة تبدأ بكِ",
    storyText:
      "في VETRINA BOUTIQUE، نؤمن أن الأناقة ليست مجرد ملابس نرتديها، بل أسلوب يعبّر عن شخصيتنا وثقة ترافقنا في كل خطوة. نختار لكِ تصاميم تجمع بين الرقي والبساطة والراحة، لتجدي ما يشبه ذوقكِ ويعبّر عنكِ.",
  },
  story: {
    enabled: true,
    eyebrow: "OUR STORY",
    title: "حكاية أناقة تبدأ بكِ",
    subtitle: "لأن الأناقة تبدأ من التفاصيل...",
    homeIntro:
      "في VETRINA BOUTIQUE، نؤمن أن الأناقة ليست مجرد ملابس نرتديها، بل أسلوب يعبّر عن شخصيتنا وثقة ترافقنا في كل خطوة. نختار لكِ تصاميم تجمع بين الرقي والبساطة والراحة، لتجدي ما يشبه ذوقكِ ويعبّر عنكِ.",
    fullStory:
      "نؤمن في VETRINA BOUTIQUE أن الأناقة ليست مجرد ملابس نرتديها، بل أسلوب يعبّر عن شخصيتنا، وثقة ترافقنا في كل خطوة.\n\nمن هنا جاءت فكرة فيترينا بوتيك؛ لنقدّم لكِ عالمًا يجمع بين الرقي والبساطة والراحة، حيث تلتقي التصاميم العصرية بالذوق الأنثوي الأصيل.\n\nنسعى إلى اختيار قطع مميزة تناسب تفاصيل يومكِ المختلفة، من إطلالاتكِ اليومية الهادئة إلى مناسباتكِ الخاصة، لتجدي دائمًا ما يشبه ذوقكِ ويعبّر عنكِ.\n\nنهتم بالتفاصيل الصغيرة التي تصنع الفرق، من تنوّع التصاميم والألوان إلى سهولة التسوق وتجربة الطلب.\n\nولأن الأناقة تستحق أن تصل إلى كل مكان، نوفّر لكِ توصيلًا مميزاً (توصيل مجاني للضفة والقدس · وللداخل بنصف السعر بـ 30 ₪).\n\nفي VETRINA BOUTIQUE، لا نريد أن نكون مجرد متجر للملابس، بل وجهتكِ المفضلة لاكتشاف إطلالتكِ القادمة.",
    quote: "أناقتكِ... بأسلوب يشبهكِ.",
    imageUrl: null,
    imageAlt: "VETRINA BOUTIQUE Editorial",
  },
  footer: {
    about: "بوتيك أزياء نسائية من فلسطين. نؤمن أن الأناقة الحقيقية هادئة، مريحة، وتشبهك.",
  },
  seo: {
    title: "VETRINA BOUTIQUE | فيترينا بوتيك",
    description: "متجر أزياء نسائية راقية في فلسطين: عبايات، بلايز، بناطيل، شالات وأطقم. توصيل مجاني للضفة والقدس وللداخل بـ 30 ₪ والدفع عند الاستلام.",
  },
  inventory: { defaultLowStockThreshold: 3 },
  revenue: { recognizeOn: "DELIVERED" },
};
