"use client";

import { Check, ChevronDown, Minus, Plus, Ruler, ShoppingBag, Truck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { addToCart } from "@/app/(store)/actions";
import { ProductGallery, type GalleryImage } from "@/components/store/product-gallery";
import { Price } from "@/components/store/price";
import { SizeChartTable, SizeFinder, type SizeChartData } from "@/components/store/size-guide";
import { WishlistButton } from "@/components/store/wishlist-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/sheet";
import { defaultColor, galleryForColor, selectVariant } from "@/lib/variant-selection";
import { cn } from "@/lib/utils";

export type ProductViewData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  description: string;
  careInstructions: string | null;
  isDemo: boolean;
  category: { name: string; slug: string } | null;
  colors: { id: string; name: string; hex: string }[];
  images: (GalleryImage & { colorId: string | null })[];
  variants: { id: string; colorId: string; size: string; stock: number; priceAdjustment: number }[];
};

function stockLabel(stock: number | null) {
  if (stock == null) return null;
  if (stock <= 0) return { text: "نفدت الكمية", tone: "text-danger" };
  if (stock <= 3) return { text: `باقي ${stock} ${stock === 1 ? "قطعة" : "قطع"} فقط`, tone: "text-danger" };
  return { text: "متوفر", tone: "text-success" };
}

export function ProductView({
  product,
  chart,
  initialColorId,
  wished,
  shippingMessage,
  shippingEstimate,
  returnsPolicy,
}: {
  product: ProductViewData;
  chart: SizeChartData | null;
  initialColorId?: string | null;
  wished: boolean;
  shippingMessage: string;
  shippingEstimate: string;
  returnsPolicy: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [colorId, setColorId] = React.useState<string | null>(() => defaultColor(product.colors, product.variants, initialColorId));
  const [size, setSize] = React.useState<string | null>(null);
  const [qty, setQty] = React.useState(1);
  const [pending, start] = React.useTransition();
  const [added, setAdded] = React.useState(false);
  const [sizeError, setSizeError] = React.useState(false);
  const ctaRef = React.useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = React.useState(false);

  const color = product.colors.find((c) => c.id === colorId) ?? null;
  const { colorVariants, sizes, effectiveSize, variant, colorStock, maxQty } = selectVariant(product.variants, colorId, size);
  const singleSize = sizes.length === 1 ? sizes[0] : null;
  const status = variant ? stockLabel(variant.stock) : colorVariants.length ? stockLabel(colorStock) : stockLabel(0);
  const galleryImages = galleryForColor(product.images, colorId);

  React.useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pickColor = (id: string) => {
    // Selected size may not exist for the new colour.
    if (size && !product.variants.some((v) => v.colorId === id && v.size === size)) setSize(null);
    setQty(1);
    setColorId(id);
    router.replace(`${pathname}?color=${id}`, { scroll: false });
  };

  const add = () => {
    if (!variant) {
      setSizeError(true);
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (variant.stock <= 0) return;
    start(async () => {
      const res = await addToCart(variant.id, qty);
      if (res.ok) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2200);
        toast.success("أُضيفت إلى سلتك", {
          description: `${product.name} — ${color?.name} / ${variant.size === "ONE SIZE" ? "مقاس واحد" : variant.size}`,
          action: { label: "عرض السلة", onClick: () => router.push("/cart") },
        });
      } else toast.error(res.error);
    });
  };

  const sizeName = (s: string) => (s === "ONE SIZE" ? "مقاس واحد" : s);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <ProductGallery key={colorId ?? "all"} images={galleryImages} name={product.name} isDemo={product.isDemo} />
      </div>

      <div className="min-w-0">
        {product.category && (
          <Link href={`/category/${product.category.slug}`} className="text-sm tracking-wide text-mauve hover:underline">
            {product.category.name}
          </Link>
        )}
        <h1 className="mt-1 text-[1.75rem] font-medium leading-tight text-burgundy md:text-4xl">{product.name}</h1>
        <Price price={product.price} salePrice={product.salePrice} adjustment={variant?.priceAdjustment ?? 0} size="lg" className="mt-3" />
        <p className="mt-2 flex items-center gap-2 text-sm text-success">
          <Truck className="size-4" aria-hidden /> {shippingMessage} — رسوم التوصيل 0 ₪
        </p>

        {/* Colour */}
        {product.colors.length > 0 && (
          <fieldset className="mt-7">
            <legend className="mb-3 text-sm">
              اللون: <span className="font-medium text-burgundy">{color?.name}</span>
            </legend>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((c) => {
                const inStock = product.variants.some((v) => v.colorId === c.id && v.stock > 0);
                const on = c.id === colorId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pickColor(c.id)}
                    aria-pressed={on}
                    aria-label={`${c.name}${inStock ? "" : " — نفدت الكمية"}`}
                    title={c.name}
                    className={cn("relative grid size-11 place-items-center rounded-full ring-offset-[3px] ring-offset-ivory transition", on ? "ring-2 ring-burgundy" : "ring-1 ring-black/10 hover:ring-mauve")}
                  >
                    <span className="size-full rounded-full" style={{ backgroundColor: c.hex }} />
                    {!inStock && <span aria-hidden className="absolute h-px w-[120%] rotate-45 bg-ink/70" />}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Size */}
        <fieldset className="mt-7" id="size-picker">
          <div className="mb-3 flex items-center justify-between">
            <legend className="text-sm">
              المقاس{effectiveSize ? ": " : ""}
              {effectiveSize && <span className="latin font-medium text-burgundy">{sizeName(effectiveSize)}</span>}
            </legend>
            {chart && !singleSize && (
              <Dialog>
                <DialogTrigger className="inline-flex items-center gap-1.5 text-sm text-burgundy underline-offset-4 hover:underline">
                  <Ruler className="size-4" /> دليل المقاسات
                </DialogTrigger>
                <DialogContent title="دليل المقاسات">
                  <SizeGuidePanel chart={chart} availableSizes={sizes} onPick={(s) => sizes.includes(s) && setSize(s)} />
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="اختاري المقاس" aria-invalid={sizeError || undefined}>
            {sizes.map((s) => {
              const v = colorVariants.find((x) => x.size === s)!;
              const out = v.stock <= 0;
              const on = effectiveSize === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={out}
                  onClick={() => {
                    setSize(s);
                    setSizeError(false);
                    setQty(1);
                  }}
                  className={cn(
                    "latin relative h-12 min-w-14 rounded-full border px-4 text-sm font-medium transition",
                    on ? "border-burgundy bg-burgundy text-ivory" : "border-line bg-white text-ink hover:border-mauve",
                    out && "cursor-not-allowed border-dashed bg-transparent text-muted/60 line-through",
                  )}
                >
                  {sizeName(s)}
                  <span className="sr-only">{out ? " — نفد" : ""}</span>
                </button>
              );
            })}
            {!sizes.length && <p className="text-sm text-muted">لا توجد مقاسات متاحة لهذا اللون.</p>}
          </div>
          <AnimatePresence>
            {sizeError && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-2 text-sm text-danger">
                يرجى اختيار المقاس أولاً
              </motion.p>
            )}
          </AnimatePresence>
          {status && (
            <p className={cn("mt-3 flex items-center gap-2 text-sm font-medium", status.tone)} aria-live="polite">
              <span className={cn("size-2 rounded-full", status.tone === "text-success" ? "bg-success" : "bg-danger")} aria-hidden />
              {variant ? status.text : colorStock > 0 ? "متوفر بمقاسات مختارة" : "هذا اللون نفد حالياً"}
            </p>
          )}
        </fieldset>

        {/* Qty + CTA */}
        <div ref={ctaRef} className="mt-7 flex flex-wrap items-stretch gap-3">
          <div className="flex h-13 items-center rounded-full border border-line bg-white" role="group" aria-label="الكمية">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="grid size-12 place-items-center text-burgundy disabled:opacity-30" aria-label="إنقاص الكمية">
              <Minus className="size-4" />
            </button>
            <output className="latin w-8 text-center font-medium" aria-live="polite">
              {qty}
            </output>
            <button type="button" onClick={() => setQty((q) => Math.min(Math.max(1, maxQty), q + 1))} disabled={!variant || qty >= maxQty} className="grid size-12 place-items-center text-burgundy disabled:opacity-30" aria-label="زيادة الكمية">
              <Plus className="size-4" />
            </button>
          </div>
          <Button size="lg" className="h-13 min-w-0 flex-1" onClick={add} loading={pending} disabled={(variant && variant.stock <= 0) || colorStock <= 0}>
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span key="ok" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="flex items-center gap-2">
                  <Check /> تمت الإضافة
                </motion.span>
              ) : (
                <motion.span key="add" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="flex items-center gap-2">
                  <ShoppingBag /> {colorStock <= 0 || (variant && variant.stock <= 0) ? "نفدت الكمية" : "أضيفي إلى السلة"}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          <WishlistButton productId={product.id} initial={wished} withLabel className="h-13 w-full sm:w-auto" />
        </div>

        <div className="mt-8 divide-y divide-line border-y border-line">
          <Accordion title="الوصف" defaultOpen>
            <p className="whitespace-pre-line leading-[1.9] text-ink/85">{product.description || "—"}</p>
          </Accordion>
          {product.careInstructions && (
            <Accordion title="العناية بالقطعة">
              <ul className="list-inside list-disc space-y-1 leading-relaxed text-ink/85">
                {product.careInstructions.split("\n").filter(Boolean).map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </Accordion>
          )}
          <Accordion title="التوصيل والاستبدال">
            <p className="leading-relaxed text-ink/85">
              {shippingMessage}. {shippingEstimate}. الدفع نقداً عند الاستلام.
            </p>
            <p className="mt-2 leading-relaxed text-ink/85">{returnsPolicy}</p>
          </Accordion>
        </div>
      </div>

      {/* Sticky mobile CTA (sits above the bottom navigation) */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur lg:hidden"
            style={{ bottom: "calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{product.name}</p>
                <p className="text-xs text-muted">
                  {color?.name}
                  {effectiveSize ? ` · ${sizeName(effectiveSize)}` : " · اختاري المقاس"}
                </p>
              </div>
              <Button onClick={add} loading={pending} disabled={(variant && variant.stock <= 0) || colorStock <= 0} className="shrink-0">
                <ShoppingBag /> أضيفي
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Accordion({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  const id = React.useId();
  return (
    <div>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between py-4 text-start font-medium text-burgundy">
        {title}
        <ChevronDown className={cn("size-5 transition-transform duration-300", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={id} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4 }} className="overflow-hidden">
            <div className="pb-5 text-[0.95rem]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SizeGuidePanel({ chart, availableSizes, onPick }: { chart: SizeChartData; availableSizes?: string[]; onPick?: (label: string) => void }) {
  const [hl, setHl] = React.useState<string | null>(null);
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <SizeFinder
        chart={chart}
        availableSizes={availableSizes}
        onResult={(k) => {
          setHl(k);
          if (k) onPick?.(k.split("-")[0]);
        }}
      />
      <SizeChartTable chart={chart} highlight={hl} availableSizes={availableSizes} />
      <Link href="/size-guide" className={cn(buttonVariants({ variant: "link" }), "text-sm")}>
        طريقة أخذ القياسات بالتفصيل
      </Link>
    </div>
  );
}
