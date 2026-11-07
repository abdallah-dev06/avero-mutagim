"use client";

import { AlertCircle, Minus, Plus, Trash2, Truck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { removeCartItem, updateCartItem } from "@/app/(store)/actions";
import { buttonVariants } from "@/components/ui/button";
import { formatILS } from "@/lib/money";
import type { CartLine } from "@/server/cart";
import { cn } from "@/lib/utils";

export function CartView({ lines, subtotal, shippingFee, shippingMessage, hasIssues }: { lines: CartLine[]; subtotal: number; shippingFee: number; shippingMessage: string; hasIssues: boolean }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
      <ul className="divide-y divide-line border-y border-line" aria-label="منتجات السلة">
        <AnimatePresence initial={false}>
          {lines.map((l) => (
            <CartRow key={l.id} line={l} />
          ))}
        </AnimatePresence>
      </ul>
      <aside className="h-fit rounded-[24px] border border-line bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6 lg:sticky lg:top-24" aria-label="ملخص الطلب">
        <h2 className="text-lg font-medium text-burgundy">ملخص الطلب</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">المجموع الفرعي</dt>
            <dd className="latin font-medium">{formatILS(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">التوصيل</dt>
            <dd className="font-medium text-success">{shippingFee === 0 ? "مجاني — 0 ₪" : <span className="latin">{formatILS(shippingFee)}</span>}</dd>
          </div>
          <div className="hairline !my-4" />
          <div className="flex justify-between text-base">
            <dt className="font-medium">الإجمالي</dt>
            <dd className="latin text-lg font-bold text-burgundy">{formatILS(subtotal + shippingFee)}</dd>
          </div>
        </dl>
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-blush px-3 py-2.5 text-xs text-burgundy">
          <Truck className="size-4 shrink-0" /> {shippingMessage} · الدفع عند الاستلام
        </p>
        {hasIssues && (
          <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> بعض المنتجات غير متوفرة بالكمية المطلوبة. عدّلي السلة للمتابعة.
          </p>
        )}
        <Link
          href="/checkout"
          aria-disabled={hasIssues}
          className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full", hasIssues && "pointer-events-none opacity-50")}
          tabIndex={hasIssues ? -1 : undefined}
        >
          إتمام الطلب
        </Link>
        <Link href="/shop" className={cn(buttonVariants({ variant: "ghost" }), "mt-2 w-full")}>
          متابعة التسوق
        </Link>
      </aside>
    </div>
  );
}

function CartRow({ line }: { line: CartLine }) {
  const [pending, start] = React.useTransition();
  const change = (q: number) =>
    start(async () => {
      const res = q === 0 ? await removeCartItem(line.id) : await updateCartItem(line.id, q);
      if (!res.ok) toast.error(res.error);
      else if (q === 0) toast.success("أُزيلت من السلة");
    });
  return (
    <motion.li layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className={cn("flex gap-4 py-5", pending && "opacity-60")}>
      <Link href={`/product/${line.slug}`} className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-2xl bg-blush sm:w-28">
        {line.image && <Image src={line.image} alt={line.name} fill sizes="112px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/product/${line.slug}`} className="line-clamp-2 font-medium text-ink hover:text-burgundy">
              {line.name}
            </Link>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <span className="size-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: line.colorHex }} />
              {line.colorName} · <span className="latin">{line.size === "ONE SIZE" ? "مقاس واحد" : line.size}</span>
            </p>
          </div>
          <button type="button" onClick={() => change(0)} disabled={pending} className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-blush hover:text-danger" aria-label={`إزالة ${line.name}`}>
            <Trash2 className="size-4" />
          </button>
        </div>
        {line.issue && (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            {line.issue}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div className="flex h-10 items-center rounded-full border border-line bg-white" role="group" aria-label="الكمية">
            <button type="button" onClick={() => change(line.quantity - 1)} disabled={pending || line.quantity <= 1} className="grid size-10 place-items-center text-burgundy disabled:opacity-30" aria-label="إنقاص">
              <Minus className="size-3.5" />
            </button>
            <span className="latin w-6 text-center text-sm font-medium">{line.quantity}</span>
            <button type="button" onClick={() => change(line.quantity + 1)} disabled={pending || line.quantity >= line.stock} className="grid size-10 place-items-center text-burgundy disabled:opacity-30" aria-label="زيادة">
              <Plus className="size-3.5" />
            </button>
          </div>
          <div className="text-left">
            <p className="latin font-bold text-burgundy">{formatILS(line.lineTotal)}</p>
            {line.quantity > 1 && <p className="latin text-xs text-muted">{formatILS(line.unitPrice)} × {line.quantity}</p>}
          </div>
        </div>
      </div>
    </motion.li>
  );
}
