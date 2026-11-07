"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function StoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-lux flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <p className="latin font-display text-sm uppercase tracking-[0.35em] text-mauve">Something went wrong</p>
      <h1 className="mt-3 text-2xl font-medium text-burgundy md:text-3xl">حدث خطأ غير متوقع</h1>
      <p className="mt-2 max-w-md text-muted">نعتذر عن ذلك. حاولي مرة أخرى، وإن استمرت المشكلة تواصلي معنا عبر واتساب.</p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>
          <RotateCcw /> إعادة المحاولة
        </Button>
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>
          الرئيسية
        </Link>
      </div>
    </div>
  );
}
