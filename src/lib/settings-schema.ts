import { z } from "zod";

const link = z.object({ label: z.string().trim().min(1).max(40), href: z.string().trim().min(1).max(300) });

export const siteSettingsSchema = z.object({
  announcement: z.object({
    enabled: z.boolean(),
    speed: z.enum(["slow", "normal", "fast"]).default("normal"),
    messages: z.array(z.string().trim().min(1).max(120)).min(1).max(12),
  }),
  hero: z.object({
    eyebrow: z.string().trim().max(60),
    title: z.string().trim().min(1).max(80),
    subtitle: z.string().trim().max(240),
    primaryCta: link,
    secondaryCta: link,
    imageUrl: z.string().trim().max(500).nullable(),
    imageAlt: z.string().trim().max(160),
    videoUrl: z.string().trim().max(500).nullable().default(null),
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
      title: z.string().trim().max(120).default("حكاية أناقة ورقي عصري للرجل"),
      subtitle: z.string().trim().max(160).default("العلامات التجارية • الجودة • الأسلوب"),
      homeIntro: z.string().trim().max(800).default(
        "في AVERO MUTAGIM، نؤمن بأن الأناقة تعبير أصيل عن الثقة والتميز. نختار لك أرقى الأزياء الرجالية والشبابية التي تجمع بين الحرفية العالية والقصات العصرية الفاخرة."
      ),
      fullStory: z.string().trim().max(3000).default(
        "نؤمن في AVERO MUTAGIM أن المظهر يعكس الشخصية والهيبة. انطلقت رحلتنا لنقدم لجيل الشباب والرجل العصري وجهة أولى للموضة العالمية الراقية، من البدل الفاخرة والقمصان المتقنة إلى الإطلالات اليومية المتميزة بأعلى معايير الجودة والخامات."
      ),
      quote: z.string().trim().max(200).default("العلامات التجارية • الجودة • الأسلوب"),
      imageUrl: z.string().trim().max(500).nullable().default(null),
      imageAlt: z.string().trim().max(160).default("AVERO MUTAGIM Men's Fashion"),
      videoUrl: z.string().trim().max(500).nullable().default("/brand/avero-story.mp4"),
    })
    .default({
      enabled: true,
      eyebrow: "OUR STORY",
      title: "حكاية أناقة ورقي عصري للرجل",
      subtitle: "العلامات التجارية • الجودة • الأسلوب",
      homeIntro:
        "في AVERO MUTAGIM، نؤمن بأن الأناقة تعبير أصيل عن الثقة والتميز. نختار لك أرقى الأزياء الرجالية والشبابية التي تجمع بين الحرفية العالية والقصات العصرية الفاخرة.",
      fullStory:
        "نؤمن في AVERO MUTAGIM أن المظهر يعكس الشخصية والهيبة. انطلقت رحلتنا لنقدم لجيل الشباب والرجل العصري وجهة أولى للموضة العالمية الراقية، من البدل الفاخرة والقمصان المتقنة إلى الإطلالات اليومية المتميزة بأعلى معايير الجودة والخامات.",
      quote: "العلامات التجارية • الجودة • الأسلوب",
      imageUrl: null,
      imageAlt: "AVERO MUTAGIM Men's Fashion",
      videoUrl: "/brand/avero-story.mp4",
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
  whatsappButton: z
    .object({
      enabled: z.boolean().default(true),
      phoneNumber: z.string().trim().max(25).default("+972528982522"),
      defaultMessage: z.string().trim().max(300).default(
        "مرحباً AVERO MUTAGIM 👑\nأود الاستفسار عن التشكيلة والمنتجات، هل يمكن مساعدتي؟"
      ),
      tooltipMessage: z.string().trim().max(200).default(
        "أهلاً بك في AVERO MUTAGIM 👑\nهل تحتاج مساعدة باختيار مقاسك أو إطلالتك؟"
      ),
      showTooltip: z.boolean().default(true),
      hideOnCheckout: z.boolean().default(true),
    })
    .default({
      enabled: true,
      phoneNumber: "+972528982522",
      defaultMessage: "مرحباً AVERO MUTAGIM 👑\nأود الاستفسار عن التشكيلة والمنتجات، هل يمكن مساعدتي؟",
      tooltipMessage: "أهلاً بك في AVERO MUTAGIM 👑\nهل تحتاج مساعدة باختيار مقاسك أو إطلالتك؟",
      showTooltip: true,
      hideOnCheckout: true,
    }),
  revenue: z.object({
    recognizeOn: z.enum(["DELIVERED", "PAID"]),
  }),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const DEFAULT_SETTINGS: SiteSettings = {
  announcement: {
    enabled: true,
    speed: "normal",
    messages: [
      "● العلامات التجارية • الجودة • الأسلوب | AVERO MUTAGIM",
      "تشكيلة رجالية وشبابية فاخرة تجمع بين الأناقة العصرية والفخامة",
      "شحن وتوصيل لجميع أنحاء البلاد وجميع البلدان",
      "الدفع نقداً عند الاستلام",
      "إطلالات استثنائية لكل يوم والمناسبات الراقية",
    ],
  },
  hero: {
    eyebrow: "AVERO MUTAGIM · MEN'S FASHION",
    title: "الفخامة والأناقة بأسلوبك العصري",
    subtitle: "تشكيلة رجالية وشبابية منتقاة بعناية تجمع بين أرقى العلامات التجارية وأجود الخامات لإطلالة تخطف الأنظار.",
    primaryCta: { label: "اكتشف الجديد", href: "/shop?sort=new" },
    secondaryCta: { label: "تصفح الأقسام", href: "/categories" },
    imageUrl: null,
    imageAlt: "AVERO MUTAGIM Men's Fashion",
    videoUrl: null,
  },
  business: {
    name: "AVERO MUTAGIM",
    whatsappNumber: "+972528982522",
    instagramUrl: "https://www.instagram.com/avero_mutagim",
    facebookUrl: "https://www.instagram.com/avero_mutagim",
    email: "",
    address: "بيان - دير الأسد | البعنة - دير الأسد",
    hours: "الأحد - الخميس: 10:00 صباحاً – 10:00 مساءً | توصيل لجميع البلدان",
  },
  shipping: {
    fee: 0,
    inside48Fee: 3000,
    message: "شحن وتوصيل لجميع أنحاء البلاد ولكافة البلدان · الدفع عند الاستلام",
    inside48Message: "شحن وتوصيل سريع وموثوق لكافة البلدان",
    estimate: "يصلك الطلب عادةً خلال 2 – 4 أيام عمل",
    returnsPolicy: "يمكن استبدال القطعة خلال 3 أيام من الاستلام بشرط أن تكون بحالتها الأصلية مع ملصقاتها الأصلية. تواصل معنا عبر واتساب لترتيب الاستبدال بكل سهولة.",
  },
  homepage: {
    showNewArrivals: true,
    showBestSellers: true,
    showCollections: true,
    showTestimonials: true,
    showStory: true,
    showLocation: true,
    storyTitle: "الفخامة والأناقة بأسلوبك العصري",
    storyText:
      "في AVERO MUTAGIM، نؤمن بأن الأناقة تعكس شخصية الرجل العصري وحضوره المميز. نحرص على انتقاء أرقى الخامات وأحدث صيحات الموضة من أشهر العلامات التجارية لنقدم لك تجربة أزياء استثنائية.",
  },
  story: {
    enabled: true,
    eyebrow: "OUR STORY",
    title: "حكاية فخامة وأسلوب لا يضاهى",
    subtitle: "العلامات التجارية • الجودة • الأسلوب",
    homeIntro:
      "في AVERO MUTAGIM، نؤمن بأن الأناقة تعكس شخصية الرجل العصري وحضوره المميز. نحرص على انتقاء أرقى الخامات وأحدث صيحات الموضة من أشهر العلامات التجارية لنقدم لك تجربة أزياء استثنائية.",
    fullStory:
      "نؤمن في AVERO MUTAGIM أن المظهر يعكس شخصية الرجل العصري وحضوره المميز. نحرص على انتقاء أرقى الخامات وأحدث صيحات الموضة من أشهر العلامات التجارية لنقدم لك تجربة أزياء استثنائية.\n\nمن البدل الفاخرة والقمصان المتقنة إلى البناطيل والجاكيتات والإكسسوارات الراقية، تم اختيار كل قطعة بعناية فائقة لتلبي تطلعاتك في إطلالاتك اليومية ومناسباتك الخاصة.\n\nنهتم بأدق التفاصيل من دقة الحياكة وتناغم الألوان إلى جودة الأقمشة ومتانتها، لنضمن لك إطلالة تليق بذوقك الرفيع.\n\nنوفر خدمة شحن وتوصيل سريعة وموثوقة لجميع أنحاء البلاد ولكافة البلدان، مع إمكانية الدفع نقداً عند الاستلام بكل راحة وأمان.",
    quote: "العلامات التجارية • الجودة • الأسلوب.",
    imageUrl: null,
    imageAlt: "AVERO MUTAGIM Men's Fashion",
    videoUrl: null,
  },
  footer: {
    about: "العلامات التجارية • الجودة • الأسلوب. وجهتك الأولى للأزياء الرجالية والشبابية الفاخرة، مع شحن سريع وتوصيل لجميع البلدان.",
  },
  seo: {
    title: "AVERO MUTAGIM | أزياء رجالية وشبابية فاخرة",
    description: "أزياء رجالية وشبابية فاخرة: بدل، قمصان، بناطيل، جاكيتات، كنزات وإكسسوارات راقية من أشهر العلامات التجارية. شحن لجميع أنحاء البلاد وتوصيل لجميع البلدان.",
  },
  inventory: { defaultLowStockThreshold: 3 },
  whatsappButton: {
    enabled: true,
    phoneNumber: "+972528982522",
    defaultMessage: "مرحباً AVERO MUTAGIM 👑، أود الاستفسار عن التشكيلة والطلب.",
    tooltipMessage: "استفسر واطلب عبر واتساب 💬",
    showTooltip: true,
    hideOnCheckout: true,
  },
  revenue: { recognizeOn: "DELIVERED" },
};
