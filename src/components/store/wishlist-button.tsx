"use client";

import { Heart } from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";
import { toast } from "sonner";
import { toggleWishlist } from "@/app/(store)/actions";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, initial, className, withLabel }: { productId: string; initial: boolean; className?: string; withLabel?: boolean }) {
  const [wished, setWished] = React.useState(initial);
  const [pending, start] = React.useTransition();
  const [prevInitial, setPrevInitial] = React.useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setWished(initial);
  }
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const optimistic = !wished;
    setWished(optimistic);
    start(async () => {
      const res = await toggleWishlist(productId);
      if (!res.ok) {
        setWished(!optimistic);
        toast.error(res.error);
      } else {
        setWished(res.wished);
        toast.success(res.wished ? "أُضيفت إلى المفضلة" : "أُزيلت من المفضلة");
      }
    });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={wished}
      aria-label={wished ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
      className={cn(
        "grid place-items-center rounded-full transition-colors",
        withLabel ? "h-12 gap-2 border border-line bg-white px-5 text-sm text-burgundy hover:border-burgundy [grid-auto-flow:column]" : "size-10 bg-white/85 text-burgundy shadow-sm backdrop-blur hover:bg-white",
        className,
      )}
    >
      <motion.span key={String(wished)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
        <Heart className={cn("size-[19px]", wished && "fill-burgundy")} strokeWidth={1.7} />
      </motion.span>
      {withLabel && <span>{wished ? "في المفضلة" : "أضف للمفضلة"}</span>}
    </button>
  );
}
