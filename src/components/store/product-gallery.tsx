"use client";

import useEmblaCarousel from "embla-carousel-react";
import { Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { Dialog as D } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export type GalleryImage = { id: string; url: string; alt: string };

export function ProductGallery({ images, name, isDemo }: { images: GalleryImage[]; name: string; isDemo: boolean }) {
  const [emblaRef, embla] = useEmblaCarousel({ direction: "rtl", loop: false, align: "start" });
  const [index, setIndex] = React.useState(0);
  const [zoomOpen, setZoomOpen] = React.useState(false);

  React.useEffect(() => {
    if (!embla) return;
    const on = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", on);
    return () => {
      embla.off("select", on);
    };
  }, [embla]);

  if (!images.length) {
    return <div className="grid aspect-[3/4] place-items-center rounded-[28px] bg-blush text-muted">لا توجد صور</div>;
  }

  return (
    <div className="lg:grid lg:grid-cols-[84px_1fr] lg:gap-4">
      {/* thumbnails (desktop) */}
      <div className="hidden max-h-[720px] flex-col gap-3 overflow-y-auto no-scrollbar lg:flex" role="tablist" aria-label="صور المنتج">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`الصورة ${i + 1}`}
            onClick={() => embla?.scrollTo(i)}
            className={cn("relative aspect-[3/4] w-full overflow-hidden rounded-xl ring-offset-2 ring-offset-ivory transition", i === index ? "ring-2 ring-burgundy" : "opacity-70 hover:opacity-100")}
          >
            <Image src={img.url} alt="" fill sizes="84px" className="object-cover" />
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="overflow-hidden rounded-[28px] bg-blush" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {images.map((img, i) => (
              <div key={img.id} className="relative aspect-[3/4] min-w-0 flex-[0_0_100%]">
                <HoverZoom src={img.url} alt={img.alt} priority={i === 0} onOpen={() => setZoomOpen(true)} />
              </div>
            ))}
          </div>
        </div>
        <AnimatePresence>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pointer-events-none absolute right-4 top-4 flex gap-2">
            {isDemo && <span className="rounded-full bg-white/90 px-3 py-1 text-xs text-muted">صورة توضيحية — منتج تجريبي</span>}
          </motion.span>
        </AnimatePresence>
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label="تكبير الصورة"
          className="absolute bottom-4 left-4 grid size-11 place-items-center rounded-full bg-white/90 text-burgundy shadow-sm backdrop-blur transition hover:bg-white"
        >
          <Maximize2 className="size-[18px]" />
        </button>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-5 flex justify-center gap-1.5 lg:hidden" aria-hidden>
            {images.map((img, i) => (
              <span key={img.id} className={cn("h-1.5 rounded-full bg-white transition-all duration-500", i === index ? "w-6 opacity-100" : "w-1.5 opacity-60")} />
            ))}
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          الصورة {index + 1} من {images.length}
        </p>
      </div>

      <ZoomDialog open={zoomOpen} onOpenChange={setZoomOpen} images={images} start={index} name={name} />
    </div>
  );
}

function HoverZoom({ src, alt, priority, onOpen }: { src: string; alt: string; priority?: boolean; onOpen: () => void }) {
  const [origin, setOrigin] = React.useState<string | null>(null);
  return (
    <div
      className="relative size-full cursor-zoom-in overflow-hidden"
      onMouseMove={(e) => {
        if (window.matchMedia("(hover: none)").matches) return;
        const r = e.currentTarget.getBoundingClientRect();
        setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
      }}
      onMouseLeave={() => setOrigin(null)}
      onDoubleClick={onOpen}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width:1024px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 ease-out"
        style={origin ? { transform: "scale(1.9)", transformOrigin: origin } : undefined}
      />
    </div>
  );
}

function ZoomDialog({ open, onOpenChange, images, start, name }: { open: boolean; onOpenChange: (v: boolean) => void; images: GalleryImage[]; start: number; name: string }) {
  const [emblaRef, embla] = useEmblaCarousel({ direction: "rtl", startIndex: start, watchDrag: true });
  const [zoomed, setZoomed] = React.useState(false);
  React.useEffect(() => {
    if (open && embla) embla.scrollTo(start, true);
  }, [open, embla, start]);
  React.useEffect(() => {
    embla?.reInit({ watchDrag: !zoomed });
  }, [embla, zoomed]);
  return (
    <D.Root
      open={open}
      onOpenChange={(o) => {
        setZoomed(false);
        onOpenChange(o);
      }}
    >
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-ivory data-[state=open]:animate-[fade-in_.3s_ease]" />
        <D.Content className="fixed inset-0 z-50 flex flex-col outline-none">
          <D.Title className="sr-only">صور {name}</D.Title>
          <D.Description className="sr-only">اسحبي للتنقل بين الصور واضغطي للتكبير</D.Description>
          <div className="flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button type="button" onClick={() => setZoomed((z) => !z)} className="grid size-11 place-items-center rounded-full text-burgundy hover:bg-blush" aria-label={zoomed ? "تصغير" : "تكبير"}>
              {zoomed ? <ZoomOut className="size-5" /> : <ZoomIn className="size-5" />}
            </button>
            <D.Close className="grid size-11 place-items-center rounded-full text-burgundy hover:bg-blush" aria-label="إغلاق">
              <X className="size-6" />
            </D.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden" ref={emblaRef}>
            <div className="flex h-full">
              {images.map((img) => (
                <div key={img.id} className={cn("relative h-full min-w-0 flex-[0_0_100%]", zoomed ? "overflow-auto" : "overflow-hidden")}>
                  <div className={cn("relative mx-auto", zoomed ? "h-[200%] w-[200%] max-w-none" : "h-full w-full")} onClick={() => setZoomed((z) => !z)}>
                    <Image src={img.url} alt={img.alt} fill sizes="100vw" quality={85} className={cn("object-contain", zoomed ? "cursor-zoom-out" : "cursor-zoom-in")} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pb-safe" />
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
