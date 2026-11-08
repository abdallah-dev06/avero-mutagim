"use client";

import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Logo } from "@/components/store/logo";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/sheet";
import { Dialog as D } from "radix-ui";
import { cn } from "@/lib/utils";

type NavCategory = { slug: string; name: string; nameEn: string | null };

export function SiteHeader({
  categories,
  cartCount,
  wishlistCount,
  signedIn,
  instagramUrl,
  whatsappHref,
}: {
  categories: NavCategory[];
  cartCount: number;
  wishlistCount: number;
  signedIn: boolean;
  instagramUrl: string;
  whatsappHref: string;
}) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const last = React.useRef(0);
  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 12);
    setHidden(y > 240 && y > last.current + 4);
    if (y < last.current - 4 || y < 240) setHidden(false);
    last.current = y;
  });
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <motion.header
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-500",
        scrolled ? "border-line/80 bg-ivory/85 shadow-[0_8px_30px_-20px_rgb(75_31_52/0.35)] backdrop-blur-xl" : "border-transparent bg-ivory/60 backdrop-blur-md",
      )}
    >
      <div className={cn("container-lux flex items-center justify-between gap-3 transition-[height] duration-500", scrolled ? "h-16" : "h-[4.5rem]")}>
        <div className="flex items-center gap-1.5">
          <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogTrigger className="grid size-11 place-items-center rounded-full text-burgundy transition hover:bg-blush lg:hidden" aria-label="فتح القائمة">
              <Menu className="size-[22px]" strokeWidth={1.6} />
            </DialogTrigger>
            <SheetContent side="right" title="القائمة">
              <nav className="flex flex-col px-5 py-4" aria-label="القائمة الرئيسية" onClick={(e) => (e.target as HTMLElement).closest("a") && setMenuOpen(false)}>
                <MobileLink href="/">الرئيسية</MobileLink>
                <MobileLink href="/about">قصتنا | Our Story</MobileLink>
                <MobileLink href="/shop?sort=new">وصل حديثاً</MobileLink>
                <MobileLink href="/shop">كل المنتجات</MobileLink>
                <p className="mt-5 mb-1 text-xs font-medium tracking-wide text-muted">الأقسام</p>
                {categories.map((c) => (
                  <MobileLink key={c.slug} href={`/category/${c.slug}`} sub={c.nameEn}>
                    {c.name}
                  </MobileLink>
                ))}
                <div className="hairline my-5" />
                <MobileLink href="/size-guide">دليل المقاسات</MobileLink>
                <MobileLink href="/track">تتبّع طلبك</MobileLink>
                <MobileLink href="/policies">التوصيل والاستبدال</MobileLink>
                <div className="mt-6 flex gap-3">
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-full border border-line py-3 text-center text-sm text-burgundy">
                    إنستغرام
                  </a>
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-full border border-line py-3 text-center text-sm text-burgundy">
                    واتساب
                  </a>
                </div>
              </nav>
            </SheetContent>
          </Dialog>
          <Logo priority size={scrolled ? 40 : 46} />
        </div>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="الأقسام">
          <DesktopLink href="/shop?sort=new" active={pathname === "/shop"}>
            الجديد
          </DesktopLink>
          {categories.slice(0, 5).map((c) => (
            <DesktopLink key={c.slug} href={`/category/${c.slug}`} active={pathname === `/category/${c.slug}`}>
              {c.name}
            </DesktopLink>
          ))}
          <DesktopLink href="/size-guide" active={pathname === "/size-guide"}>
            دليل المقاسات
          </DesktopLink>
          <DesktopLink href="/about" active={pathname === "/about"}>
            قصتنا
          </DesktopLink>
        </nav>

        <div className="flex items-center gap-0.5">
          <SearchButton />
          <IconLink href="/wishlist" label="المفضلة" count={wishlistCount} className="hidden lg:grid">
            <Heart className="size-[21px]" strokeWidth={1.6} />
          </IconLink>
          <IconLink href="/cart" label="سلة التسوق" count={cartCount}>
            <ShoppingBag className="size-[21px]" strokeWidth={1.6} />
          </IconLink>
        </div>
      </div>
    </motion.header>
  );
}

function DesktopLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative px-3.5 py-2 text-[0.95rem] text-ink transition-colors hover:text-burgundy",
        active && "text-burgundy",
      )}
    >
      {children}
      <span
        className={cn(
          "absolute inset-x-3.5 -bottom-0.5 h-px origin-center scale-x-0 bg-mauve transition-transform duration-500 ease-[var(--ease-lux)] group-hover:scale-x-100",
          active && "scale-x-100",
        )}
      />
    </Link>
  );
}

function MobileLink({ href, children, sub }: { href: string; children: React.ReactNode; sub?: string | null }) {
  return (
    <Link href={href} className="flex items-center justify-between border-b border-line/70 py-3.5 text-[1.05rem] text-ink transition-colors hover:text-burgundy">
      <span>{children}</span>
      {sub && <span className="latin font-display text-xs tracking-[0.2em] text-mauve uppercase">{sub}</span>}
    </Link>
  );
}

function IconLink({ href, label, count, children, className }: { href: string; label: string; count?: number; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} aria-label={count ? `${label} (${count})` : label} className={cn("relative grid size-11 place-items-center rounded-full text-burgundy transition hover:bg-blush", className)}>
      {children}
      {!!count && (
        <motion.span
          key={count}
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="absolute top-1 left-1 grid min-w-[18px] place-items-center rounded-full bg-burgundy px-1 text-[10px] font-bold leading-[18px] text-ivory"
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </Link>
  );
}

export function SearchButton({ variant = "icon" }: { variant?: "icon" | "nav" }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const router = useRouter();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
  };
  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <D.Trigger
        aria-label="بحث"
        className={variant === "icon" ? "grid size-11 place-items-center rounded-full text-burgundy transition hover:bg-blush" : "flex flex-col items-center gap-1"}
      >
        <Search className="size-[21px]" strokeWidth={1.6} />
      </D.Trigger>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-burgundy-900/30 backdrop-blur-sm data-[state=open]:animate-[fade-in_.25s_ease]" />
        <D.Content className="fixed inset-x-0 top-0 z-50 bg-ivory px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] shadow-[var(--shadow-lift)] outline-none data-[state=open]:animate-[fade-in_.3s_ease] sm:px-8">
          <D.Title className="sr-only">البحث في المتجر</D.Title>
          <D.Description className="sr-only">اكتبي اسم المنتج أو القسم أو اللون</D.Description>
          <form onSubmit={submit} className="mx-auto mt-2 flex max-w-2xl items-center gap-2 border-b-2 border-burgundy/80 pb-2" role="search">
            <Search className="size-6 shrink-0 text-mauve" strokeWidth={1.5} aria-hidden />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              enterKeyHint="search"
              placeholder="ابحثي عن عباية، بلوزة، لون…"
              aria-label="كلمة البحث"
              className="min-w-0 flex-1 bg-transparent py-2 text-lg text-ink outline-none placeholder:text-muted/70 sm:text-xl"
            />
            <D.Close className="shrink-0 rounded-full px-3 py-2 text-sm text-muted hover:bg-blush">إلغاء</D.Close>
          </form>
          <div className="mx-auto mt-5 flex max-w-2xl flex-wrap gap-2">
            {["عبايات", "بلايز", "شالات", "أطقم", "أسود", "بيج"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(`/shop?q=${encodeURIComponent(t)}`);
                }}
                className="rounded-full bg-blush px-4 py-2 text-sm text-burgundy transition hover:bg-dusty/50"
              >
                {t}
              </button>
            ))}
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
