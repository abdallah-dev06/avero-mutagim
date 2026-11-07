"use client";

import { Heart, Home, LayoutGrid, PackageCheck, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ cartCount, wishlistCount }: { cartCount: number; wishlistCount: number; signedIn?: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "الرئيسية", icon: Home, match: (p: string) => p === "/" },
    { href: "/categories", label: "الأقسام", icon: LayoutGrid, match: (p: string) => p.startsWith("/categor") || p.startsWith("/shop") || p.startsWith("/collections") },
    { href: "/wishlist", label: "المفضلة", icon: Heart, match: (p: string) => p === "/wishlist", count: wishlistCount },
    { href: "/cart", label: "السلة", icon: ShoppingBag, match: (p: string) => p === "/cart" || p === "/checkout", count: cartCount },
    { href: "/track", label: "تتبّع طلبك", icon: PackageCheck, match: (p: string) => p.startsWith("/track") || p.startsWith("/order") },
  ];
  if (pathname === "/checkout") return null;
  return (
    <nav
      aria-label="التنقل السفلي"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-ivory/90 pb-safe backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid h-[var(--bottom-nav-h)] max-w-lg grid-cols-5">
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <li key={it.label} className="relative">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn("flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors", active ? "text-burgundy" : "text-muted")}
              >
                {active && (
                  <motion.span layoutId="bottom-nav-pill" className="absolute top-0 h-[3px] w-8 rounded-b-full bg-burgundy" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                )}
                <span className="relative">
                  <Icon className="size-[22px]" strokeWidth={active ? 2 : 1.6} />
                  {!!it.count && (
                    <span className="absolute -top-1.5 -left-2 grid min-w-[17px] place-items-center rounded-full bg-burgundy px-1 text-[10px] font-bold leading-[17px] text-ivory">
                      {it.count > 99 ? "99+" : it.count}
                    </span>
                  )}
                </span>
                <span className={cn(active && "font-medium")}>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
