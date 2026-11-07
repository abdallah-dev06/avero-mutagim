"use client";

import {
  Boxes,
  ClipboardList,
  ExternalLink,
  FolderTree,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Ruler,
  Settings,
  Shirt,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { adminLogout } from "@/app/admin/login/actions";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "الطلبات", icon: ClipboardList, badge: "orders" as const },
  { href: "/admin/products", label: "المنتجات", icon: Shirt },
  { href: "/admin/inventory", label: "المخزون", icon: Boxes, badge: "stock" as const },
  { href: "/admin/categories", label: "الأقسام والمجموعات", icon: FolderTree },
  { href: "/admin/size-charts", label: "دليل المقاسات", icon: Ruler },
  { href: "/admin/delivery", label: "مناطق التوصيل", icon: MapPin },
  { href: "/admin/whatsapp", label: "قوالب واتساب", icon: MessageCircle },
  { href: "/admin/settings", label: "إعدادات الموقع", icon: Settings },
  { href: "/admin/activity", label: "سجل النشاط", icon: History },
];

function NavList({ counts, onNavigate }: { counts: { orders: number; stock: number }; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="قائمة الإدارة">
      {NAV.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        const count = n.badge ? counts[n.badge] : 0;
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] transition-colors",
              active ? "bg-burgundy text-ivory" : "text-ink hover:bg-blush",
            )}
          >
            <n.icon className="size-[18px] shrink-0" strokeWidth={1.7} />
            <span className="flex-1">{n.label}</span>
            {count > 0 && (
              <span className={cn("latin rounded-full px-2 py-0.5 text-[11px] font-bold", active ? "bg-ivory text-burgundy" : n.badge === "stock" ? "bg-amber-100 text-amber-900" : "bg-burgundy text-ivory")}>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ user, counts, children }: { user: { name: string; role: string }; counts: { orders: number; stock: number }; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const footer = (
    <div className="border-t border-line p-3">
      <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-blush">
        <ExternalLink className="size-4" /> عرض المتجر
      </Link>
      <form action={adminLogout}>
        <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-blush hover:text-danger">
          <LogOut className="size-4" /> تسجيل الخروج
        </button>
      </form>
      <p className="px-3 pt-2 text-xs text-muted">
        {user.name} · {user.role === "ADMIN" ? "مدير" : "موظف"}
      </p>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#f6f1ef] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-l border-line bg-white lg:flex">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Image src="/brand/logo-round.png" alt="" width={40} height={40} className="rounded-full" />
          <div className="latin leading-none">
            <p className="font-display tracking-[0.18em] text-burgundy">VETRINA</p>
            <p className="mt-1 text-[10px] tracking-[0.3em] text-mauve">ADMIN</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavList counts={counts} />
        </div>
        {footer}
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/90 px-3 backdrop-blur lg:hidden">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="grid size-11 place-items-center rounded-full text-burgundy hover:bg-blush" aria-label="فتح القائمة">
              <Menu className="size-5" />
            </DialogTrigger>
            <SheetContent side="right" title="لوحة الإدارة">
              <div className="flex h-full flex-col">
                <div className="flex-1">
                  <NavList counts={counts} onNavigate={() => setOpen(false)} />
                </div>
                {footer}
              </div>
            </SheetContent>
          </Dialog>
          <p className="latin font-display tracking-[0.18em] text-burgundy">VETRINA</p>
          <Link href="/admin/orders" className="relative grid size-11 place-items-center rounded-full text-burgundy hover:bg-blush" aria-label={`الطلبات الجديدة (${counts.orders})`}>
            <ClipboardList className="size-5" />
            {counts.orders > 0 && <span className="latin absolute left-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-burgundy px-1 text-[10px] font-bold leading-[18px] text-ivory">{counts.orders}</span>}
          </Link>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1400px] px-3 py-5 pb-safe sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-medium text-burgundy md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title, actions }: { children: React.ReactNode; className?: string; title?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-white p-4 sm:p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-medium text-burgundy">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
