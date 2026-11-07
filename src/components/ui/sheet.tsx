"use client";

import { X } from "lucide-react";
import { Dialog as D } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

const overlay =
  "fixed inset-0 z-50 bg-burgundy-900/40 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_.3s_ease] data-[state=closed]:animate-[fade-out_.2s_ease]";

export function SheetContent({
  side = "right",
  title,
  description,
  children,
  className,
}: {
  side?: "right" | "left" | "bottom";
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const pos = {
    right: "inset-y-0 right-0 h-dvh w-[min(92vw,420px)] data-[state=open]:animate-[sheet-in-right_.45s_var(--ease-lux)]",
    left: "inset-y-0 left-0 h-dvh w-[min(92vw,420px)] data-[state=open]:animate-[sheet-in-left_.45s_var(--ease-lux)]",
    bottom: "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[28px] data-[state=open]:animate-[sheet-in-bottom_.45s_var(--ease-lux)]",
  }[side];
  return (
    <D.Portal>
      <D.Overlay className={overlay} />
      <D.Content
        className={cn("fixed z-50 flex flex-col bg-ivory shadow-[var(--shadow-lift)] outline-none", pos, className)}
        aria-describedby={description ? undefined : undefined}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <D.Title className="font-medium text-burgundy">{title}</D.Title>
          <D.Close className="grid size-10 place-items-center rounded-full text-burgundy transition hover:bg-blush" aria-label="إغلاق">
            <X className="size-5" />
          </D.Close>
        </div>
        {description ? <D.Description className="sr-only">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
        <div className="min-h-0 flex-1 overflow-y-auto pb-safe">{children}</div>
      </D.Content>
    </D.Portal>
  );
}

export function DialogContent({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <D.Portal>
      <D.Overlay className={overlay} />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[min(94vw,640px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-ivory shadow-[var(--shadow-lift)] outline-none data-[state=open]:animate-[dialog-in_.35s_var(--ease-lux)]",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <D.Title className="font-medium text-burgundy">{title}</D.Title>
          <D.Close className="grid size-10 place-items-center rounded-full text-burgundy transition hover:bg-blush" aria-label="إغلاق">
            <X className="size-5" />
          </D.Close>
        </div>
        <D.Description className="sr-only">{description ?? title}</D.Description>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </D.Content>
    </D.Portal>
  );
}
