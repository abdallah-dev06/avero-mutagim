import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("skeleton rounded-xl", className)} {...props} />;
}

export function Badge({ className, tone = "blush", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "blush" | "burgundy" | "ivory" | "success" | "danger" | "muted" }) {
  const tones = {
    blush: "bg-blush text-burgundy",
    burgundy: "bg-burgundy text-ivory",
    ivory: "bg-white/85 text-burgundy backdrop-blur",
    success: "bg-emerald-50 text-emerald-900",
    danger: "bg-rose-50 text-danger",
    muted: "bg-stone-100 text-stone-700",
  } as const;
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium leading-none", tones[tone], className)} {...props} />;
}

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      {icon && <div className="mb-5 grid size-20 place-items-center rounded-full bg-blush text-mauve [&_svg]:size-8">{icon}</div>}
      <h2 className="text-xl font-medium text-burgundy">{title}</h2>
      {description && <p className="mt-2 leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, action, className }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-7 flex flex-wrap items-end justify-between gap-4 md:mb-10", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="latin font-display text-xs uppercase tracking-[0.35em] text-mauve md:text-sm">{eyebrow}</p>}
        <h2 className="mt-2 text-[1.65rem] font-medium leading-tight text-burgundy md:text-4xl">{title}</h2>
        {description && <p className="mt-3 leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
