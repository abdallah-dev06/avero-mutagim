"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-10 text-center">
      <h1 className="text-xl font-medium text-burgundy">تعذّر تحميل هذه الصفحة</h1>
      <p className="mt-2 text-sm text-muted">حدث خطأ غير متوقع. لم يتم حفظ أي تغيير غير مكتمل.</p>
      <Button className="mt-5" onClick={reset}>
        إعادة المحاولة
      </Button>
    </div>
  );
}
