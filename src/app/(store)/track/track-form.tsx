"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { trackOrder } from "@/app/(store)/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";

export function TrackForm({ initialRef }: { initialRef: string }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  return (
    <form
      className="mt-8 space-y-4 rounded-[24px] border border-line bg-white p-5 sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const res = await trackOrder({ reference: fd.get("reference"), phone: fd.get("phone") });
          if (res.ok) router.push(res.redirectTo);
          else setError(res.error);
        });
      }}
    >
      <Field label="رقم الطلب" htmlFor="reference" required>
        <Input id="reference" name="reference" dir="ltr" className="text-right uppercase" placeholder="VB-XXXX-XXXX" defaultValue={initialRef} required autoComplete="off" />
      </Field>
      <Field label="رقم الهاتف" htmlFor="phone" required>
        <Input id="phone" name="phone" type="tel" inputMode="tel" dir="ltr" className="text-right" placeholder="0599 123 456" required autoComplete="tel" />
      </Field>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" loading={pending}>
        عرض حالة الطلب
      </Button>
    </form>
  );
}
