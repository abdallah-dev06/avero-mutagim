"use client";

import { Check, X } from "lucide-react";
import { motion } from "motion/react";
import type { OrderStatus } from "@/generated/prisma/enums";
import { FULFILLMENT_FLOW, ORDER_STATUS_LABEL, progressIndex } from "@/lib/order-status";
import { cn, formatDate } from "@/lib/utils";

export function OrderSuccessMark() {
  return (
    <div className="relative mx-auto size-24" aria-hidden>
      <motion.span
        className="absolute inset-0 rounded-full bg-blush"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.15, 1] }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 size-1.5 rounded-full bg-gold"
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: Math.cos((i / 8) * Math.PI * 2) * 64, y: Math.sin((i / 8) * Math.PI * 2) * 64, opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, delay: 0.45, ease: "easeOut" }}
        />
      ))}
      <svg viewBox="0 0 96 96" className="relative size-full">
        <motion.circle cx="48" cy="48" r="34" fill="none" stroke="#4B1F34" strokeWidth="2.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.2 }} />
        <motion.path d="M33 49 l10 10 l21 -23" fill="none" stroke="#4B1F34" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.85 }} />
      </svg>
    </div>
  );
}

export function OrderTimeline({ status, events }: { status: OrderStatus; events: { status: OrderStatus | null; at: string }[] }) {
  const terminal = status === "CANCELLED" || status === "RETURNED";
  if (terminal) {
    const at = [...events].reverse().find((e) => e.status === status)?.at;
    return (
      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-stone-700">
        <span className="grid size-10 place-items-center rounded-full bg-stone-200">
          <X className="size-5" />
        </span>
        <div>
          <p className="font-medium">{status === "CANCELLED" ? "تم إلغاء هذا الطلب" : "تم تسجيل إرجاع هذا الطلب"}</p>
          {at && <p className="text-sm text-muted">{formatDate(at, true)}</p>}
        </div>
      </div>
    );
  }
  const current = progressIndex(status);
  const when = (s: OrderStatus) => events.find((e) => e.status === s)?.at;
  return (
    <ol className="mt-8 grid gap-0 sm:grid-cols-6" aria-label="مراحل الطلب">
      {FULFILLMENT_FLOW.map((s, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <li key={s} className="relative flex gap-4 pb-6 sm:flex-col sm:items-center sm:gap-2 sm:pb-0 sm:text-center" aria-current={active ? "step" : undefined}>
            {i < FULFILLMENT_FLOW.length - 1 && (
              <>
                <span aria-hidden className="absolute right-[15px] top-8 h-[calc(100%-2rem)] w-0.5 bg-line sm:right-[calc(50%+1rem)] sm:top-[15px] sm:h-0.5 sm:w-[calc(100%-2rem)]" />
                <motion.span
                  aria-hidden
                  initial={{ scaleY: 0, scaleX: 0 }}
                  animate={{ scaleY: i < current ? 1 : 0, scaleX: i < current ? 1 : 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
                  className="absolute right-[15px] top-8 h-[calc(100%-2rem)] w-0.5 origin-top bg-burgundy sm:right-[calc(50%+1rem)] sm:top-[15px] sm:h-0.5 sm:w-[calc(100%-2rem)] sm:origin-right"
                />
              </>
            )}
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.12 }}
              className={cn(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs",
                done ? "border-burgundy bg-burgundy text-ivory" : "border-line bg-white text-muted",
                active && "ring-4 ring-dusty/40",
              )}
            >
              {done ? <Check className="size-4" /> : <span className="latin">{i + 1}</span>}
            </motion.span>
            <div>
              <p className={cn("text-sm", done ? "font-medium text-burgundy" : "text-muted")}>{ORDER_STATUS_LABEL[s]}</p>
              {when(s) && <p className="text-[11px] text-muted">{formatDate(when(s)!, true)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
