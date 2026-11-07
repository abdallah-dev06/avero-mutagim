import { discountPercent, effectivePrice, formatILS } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({ price, salePrice, adjustment = 0, className, size = "md" }: { price: number; salePrice: number | null; adjustment?: number; className?: string; size?: "sm" | "md" | "lg" }) {
  const eff = effectivePrice({ price, salePrice }) + adjustment;
  const orig = price + adjustment;
  const off = discountPercent({ price, salePrice });
  const sizes = { sm: "text-[0.95rem]", md: "text-base", lg: "text-2xl" };
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("latin font-bold text-burgundy", sizes[size])}>{formatILS(eff)}</span>
      {off > 0 && (
        <>
          <span className="latin text-sm text-muted line-through decoration-mauve/60">
            <span className="sr-only">السعر قبل الخصم </span>
            {formatILS(orig)}
          </span>
          {size === "lg" && <span className="rounded-full bg-blush px-2 py-0.5 text-xs font-medium text-burgundy">وفّري {off}%</span>}
        </>
      )}
    </p>
  );
}
