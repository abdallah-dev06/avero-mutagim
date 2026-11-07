import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-blush to-ivory px-4 text-center">
      <span className="block size-24 overflow-hidden rounded-full ring-1 ring-gold/40">
        <Image src="/brand/logo-round.png" alt="VETRINA BOUTIQUE" width={192} height={192} className="size-full object-cover" />
      </span>
      <p className="latin mt-8 font-display text-7xl text-dusty">404</p>
      <h1 className="mt-2 text-2xl font-medium text-burgundy">الصفحة غير موجودة</h1>
      <p className="mt-2 max-w-sm text-muted">ربما نُقلت هذه الصفحة أو لم تعد متاحة.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants()}>
          العودة للرئيسية
        </Link>
        <Link href="/shop" className={buttonVariants({ variant: "secondary" })}>
          تسوّقي المنتجات
        </Link>
      </div>
    </main>
  );
}
