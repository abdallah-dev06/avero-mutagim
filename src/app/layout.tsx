import type { Metadata, Viewport } from "next";
import { Playfair_Display, Tajawal } from "next/font/google";
import { Toaster } from "sonner";
import { MotionProvider } from "@/components/motion/motion-provider";
import { absoluteUrl } from "@/lib/utils";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: { default: "VETRINA BOUTIQUE | فيترينا بوتيك", template: "%s | VETRINA BOUTIQUE" },
  description:
    "متجر أزياء نسائية راقية في فلسطين: عبايات، بلوزات، بناطيل، شالات وأطقم. توصيل مجاني لجميع أنحاء فلسطين والدفع عند الاستلام.",
  applicationName: "VETRINA BOUTIQUE",
  openGraph: {
    type: "website",
    locale: "ar_PS",
    siteName: "VETRINA BOUTIQUE",
    images: [{ url: "/brand/og.jpg", width: 1200, height: 630, alt: "VETRINA BOUTIQUE" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#4B1F34",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${playfair.variable}`}>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[100] focus:rounded-full focus:bg-burgundy focus:px-4 focus:py-2 focus:text-ivory"
        >
          تخطّي إلى المحتوى
        </a>
        <MotionProvider>{children}</MotionProvider>
        <Toaster
          dir="rtl"
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "!font-sans !rounded-2xl !border-line !bg-white !text-ink !shadow-[var(--shadow-lift)]",
              title: "!font-medium",
            },
          }}
        />
      </body>
    </html>
  );
}
