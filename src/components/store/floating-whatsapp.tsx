"use client";

import { usePathname } from "next/navigation";
import * as React from "react";
import { X } from "lucide-react";
import { waDigits } from "@/lib/phone";
import { cn } from "@/lib/utils";

export type ProductContextDetail = {
  productName: string;
  colorName?: string | null;
  size?: string | null;
  productUrl?: string | null;
};

export function FloatingWhatsAppButton({
  phoneNumber,
  defaultMessage,
  tooltipMessage,
  showTooltip = true,
  hideOnCheckout = true,
  enabled = true,
}: {
  phoneNumber?: string;
  defaultMessage?: string;
  tooltipMessage?: string;
  showTooltip?: boolean;
  hideOnCheckout?: boolean;
  enabled?: boolean;
}) {
  const pathname = usePathname();
  const [productContext, setProductContext] = React.useState<ProductContextDetail | null>(null);
  const [tooltipVisible, setTooltipVisible] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Clean phone digits for wa.me
  const cleanNumber = waDigits(phoneNumber || "+970599571202");

  // Listen to product page context changes
  React.useEffect(() => {
    setMounted(true);
    const handler = (e: Event) => {
      const custom = e as CustomEvent<ProductContextDetail | null>;
      setProductContext(custom.detail ?? null);
    };
    window.addEventListener("vb:product-context", handler);
    return () => window.removeEventListener("vb:product-context", handler);
  }, []);

  // Clear product context if user navigates away from /product/
  React.useEffect(() => {
    if (!pathname?.startsWith("/product/")) {
      setProductContext(null);
    }
  }, [pathname]);

  // Check sessionStorage for dismissed tooltip
  React.useEffect(() => {
    if (!showTooltip) return;
    try {
      const dismissed = sessionStorage.getItem("vb_wa_tooltip_dismissed");
      if (!dismissed) {
        // Show tooltip gently after a short delay
        const timer = setTimeout(() => {
          setTooltipVisible(true);
        }, 2200);
        return () => clearTimeout(timer);
      }
    } catch {
      /* ignore */
    }
  }, [showTooltip]);

  const dismissTooltip = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setTooltipVisible(false);
    try {
      sessionStorage.setItem("vb_wa_tooltip_dismissed", "true");
    } catch {
      /* ignore */
    }
  };

  if (!enabled || !cleanNumber) return null;
  if (hideOnCheckout && pathname === "/checkout") return null;
  if (!mounted) return null;

  // Build tailored message
  let message = defaultMessage || "مرحبًا VETRINA BOUTIQUE 🌸\nحابّة أستفسر عن منتجاتكم، ممكن تساعدوني؟";

  if (productContext && pathname?.startsWith("/product/")) {
    const lines = ["مرحبًا VETRINA BOUTIQUE 🌸", `حابّة أستفسر عن: ${productContext.productName}`];
    if (productContext.colorName) {
      lines.push(`اللون: ${productContext.colorName}`);
    }
    if (productContext.size && productContext.size !== "ONE SIZE") {
      lines.push(`المقاس: ${productContext.size}`);
    }
    if (productContext.productUrl) {
      lines.push(`الرابط: ${productContext.productUrl}`);
    }
    message = lines.join("\n");
  }

  const waHref = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

  return (
    <aside
      aria-label="خدمة عملاء واتساب"
      className="fixed z-30 left-4 sm:left-6 transition-all duration-300"
      style={{
        // On mobile: sit safely above the bottom nav + safe area.
        // On desktop: sit at standard bottom-6.
        bottom: "calc(var(--bottom-nav-h, 64px) + env(safe-area-inset-bottom, 0px) + 14px)",
      }}
    >
      <div className="relative flex flex-col items-start gap-2.5">
        {/* ───────────── Gentle Greeting Tooltip ───────────── */}
        {showTooltip && tooltipVisible && (
          <div
            role="dialog"
            aria-label="رسالة ترحيبية للمساعدة"
            onClick={() => {
              window.open(waHref, "_blank", "noopener,noreferrer");
              dismissTooltip();
            }}
            className="group relative max-w-[240px] cursor-pointer rounded-2xl border border-gold/40 bg-white/95 p-3.5 pe-7 text-xs text-ink shadow-[0_8px_30px_rgba(75,31,52,0.18)] backdrop-blur-md transition-all duration-300 hover:border-gold hover:shadow-lg sm:max-w-[260px] animate-[fade-in_.3s_ease]"
          >
            {/* Dismiss Button */}
            <button
              type="button"
              onClick={dismissTooltip}
              aria-label="إغلاق الرسالة"
              className="absolute left-2 top-2 grid size-5 place-items-center rounded-full text-muted transition hover:bg-blush hover:text-burgundy"
            >
              <X className="size-3" />
            </button>

            <p className="whitespace-pre-line text-xs font-medium leading-relaxed text-burgundy">
              {tooltipMessage || "أهلًا فيكِ 🌸\nمحتاجة مساعدة باختيار إطلالتكِ؟ تواصلي معنا!"}
            </p>

            <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-gold group-hover:underline">
              <span>محادثة فورية</span>
              <span className="text-[10px]">←</span>
            </span>

            {/* Pointer arrow pointing down-left towards the button */}
            <span
              aria-hidden
              className="absolute -bottom-1.5 left-6 size-3 rotate-45 border-b border-r border-gold/40 bg-white"
            />
          </div>
        )}

        {/* ───────────── Premium Floating WhatsApp Button ───────────── */}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="تواصلي معنا عبر واتساب — VETRINA BOUTIQUE"
          title="محادثة واتساب مباشرة"
          className={cn(
            "group relative grid size-14 place-items-center rounded-full",
            "bg-[#25D366] text-white",
            "border-2 border-[#4B1F34]/20 ring-2 ring-white/90",
            "shadow-[0_8px_24px_rgba(37,211,102,0.38)]",
            "transition-all duration-300 ease-[var(--ease-lux)]",
            "hover:scale-105 hover:shadow-[0_12px_30px_rgba(37,211,102,0.5)]",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400"
          )}
        >
          {/* Subtle online indicator dot */}
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-400"
          />

          {/* Official Crisp WhatsApp SVG Icon */}
          <svg
            viewBox="0 0 24 24"
            className="size-7 fill-white transition-transform duration-300 group-hover:scale-110"
            aria-hidden
          >
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.5C9.33 7.5 9 7.57 8.71 7.88C8.42 8.19 7.62 8.94 7.62 10.47C7.62 12 8.74 13.48 8.89 13.69C9.05 13.9 11.1 17.05 14.23 18.4C14.97 18.72 15.56 18.91 16 19.06C16.75 19.3 17.43 19.26 17.96 19.18C18.56 19.09 19.8 18.43 20.06 17.7C20.31 16.98 20.31 16.36 20.24 16.24C20.16 16.11 19.96 16.03 19.66 15.89C19.35 15.73 17.85 15 17.57 14.9C17.29 14.79 17.09 14.74 16.89 15.05C16.68 15.35 16.1 16.03 15.92 16.24C15.74 16.44 15.57 16.47 15.26 16.32C14.95 16.16 13.97 15.84 12.8 14.8C11.9 14 11.28 13 11.11 12.7C10.93 12.4 11.09 12.24 11.25 12.08C11.39 11.95 11.56 11.72 11.71 11.54C11.87 11.37 11.92 11.24 12.02 11.04C12.12 10.83 12.07 10.65 12 10.5C11.92 10.35 11.31 8.87 11.06 8.26C10.81 7.67 10.56 7.75 10.37 7.74C10.19 7.74 9.99 7.73 9.79 7.73L9.53 7.5Z" />
          </svg>
        </a>
      </div>
    </aside>
  );
}
