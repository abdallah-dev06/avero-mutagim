import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** The approved AVERO MUTAGIM monogram logo + brand name set in the display face. */
export function Logo({
  className,
  size = 44,
  withWordmark = true,
  priority,
  inverse = false,
}: {
  className?: string;
  size?: number;
  withWordmark?: boolean;
  priority?: boolean;
  inverse?: boolean;
}) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)} aria-label="AVERO MUTAGIM — الصفحة الرئيسية">
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden rounded-full ring-1 transition-transform duration-500 ease-[var(--ease-lux)] group-hover:scale-105",
          inverse ? "ring-gold/70 shadow-[0_0_12px_rgba(212,175,55,0.25)]" : "ring-gold/40"
        )}
        style={{ width: size, height: size }}
      >
        <Image src="/brand/logo-round.png" alt="" width={size * 2} height={size * 2} priority={priority} className="size-full object-cover" />
      </span>
      {withWordmark && (
        <span className={cn("latin flex flex-col leading-none", inverse ? "text-ivory" : "text-burgundy")}>
          <span className="font-display text-[1.05rem] font-semibold tracking-[0.2em] sm:text-lg">AVERO</span>
          <span className="mt-1 text-[0.58rem] tracking-[0.42em] text-gold font-medium">MUTAGIM</span>
        </span>
      )}
    </Link>
  );
}
