"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, SheetContent, DialogClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Facets = { sizes: string[]; colors: { name: string; hex: string }[]; minPrice: number; maxPrice: number };

export const SORTS = [
  { value: "new", label: "الأحدث" },
  { value: "best", label: "الأكثر مبيعاً" },
  { value: "price-asc", label: "السعر: من الأقل" },
  { value: "price-desc", label: "السعر: من الأعلى" },
] as const;

function useParamsState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const update = React.useCallback(
    (mut: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mut(next);
      next.delete("page");
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );
  return { params, update };
}

export function SortSelect() {
  const { params, update } = useParamsState();
  return (
    <label className="relative flex items-center gap-2 text-sm">
      <span className="sr-only sm:not-sr-only sm:text-muted">ترتيب:</span>
      <select
        value={params.get("sort") ?? "new"}
        onChange={(e) => update((p) => p.set("sort", e.target.value))}
        className="h-11 appearance-none rounded-full border border-line bg-white pe-4 ps-9 text-sm text-ink focus:border-mauve focus:outline-none"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute left-3.5 size-4 text-muted">
        <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </label>
  );
}

function FilterBody({ facets, onDone }: { facets: Facets; onDone?: () => void }) {
  const { params, update } = useParamsState();
  const selSizes = params.getAll("size");
  const selColors = params.getAll("color");
  const [min, setMin] = React.useState(params.get("min") ?? "");
  const [max, setMax] = React.useState(params.get("max") ?? "");
  const toggle = (key: string, value: string) =>
    update((p) => {
      const cur = p.getAll(key);
      p.delete(key);
      (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]).forEach((v) => p.append(key, v));
    });

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-sm font-bold text-burgundy">التوفر</legend>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-5 accent-burgundy"
            checked={params.get("available") === "1"}
            onChange={(e) => update((p) => (e.target.checked ? p.set("available", "1") : p.delete("available")))}
          />
          المتوفر فقط
        </label>
        <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" className="size-5 accent-burgundy" checked={params.get("sale") === "1"} onChange={(e) => update((p) => (e.target.checked ? p.set("sale", "1") : p.delete("sale")))} />
          عليها خصم
        </label>
      </fieldset>

      {facets.sizes.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-bold text-burgundy">المقاس</legend>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => {
              const on = selSizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle("size", s)}
                  className={cn("latin h-10 min-w-12 rounded-full border px-3 text-sm transition", on ? "border-burgundy bg-burgundy text-ivory" : "border-line bg-white text-ink hover:border-mauve")}
                >
                  {s === "ONE SIZE" ? "مقاس واحد" : s}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {facets.colors.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-bold text-burgundy">اللون</legend>
          <div className="grid grid-cols-2 gap-2">
            {facets.colors.map((c) => {
              const on = selColors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle("color", c.name)}
                  className={cn("flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition", on ? "border-burgundy bg-blush" : "border-line bg-white hover:border-mauve")}
                >
                  <span className="size-5 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c.hex }} />
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-3 text-sm font-bold text-burgundy">السعر (₪)</legend>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update((p) => {
              if (min) p.set("min", min);
              else p.delete("min");
              if (max) p.set("max", max);
              else p.delete("max");
            });
            onDone?.();
          }}
        >
          <input inputMode="numeric" aria-label="أقل سعر" placeholder={String(facets.minPrice)} value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} className="h-11 w-full min-w-0 rounded-xl border border-line bg-white px-3 text-[16px]" />
          <span className="text-muted">–</span>
          <input inputMode="numeric" aria-label="أعلى سعر" placeholder={String(facets.maxPrice)} value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} className="h-11 w-full min-w-0 rounded-xl border border-line bg-white px-3 text-[16px]" />
          <Button type="submit" size="sm" variant="soft" className="h-11 shrink-0">
            تطبيق
          </Button>
        </form>
      </fieldset>
    </div>
  );
}

export function ActiveFilters() {
  const { params, update } = useParamsState();
  const chips: { key: string; value: string; label: string }[] = [];
  params.getAll("size").forEach((v) => chips.push({ key: "size", value: v, label: `مقاس ${v === "ONE SIZE" ? "واحد" : v}` }));
  params.getAll("color").forEach((v) => chips.push({ key: "color", value: v, label: v }));
  if (params.get("available")) chips.push({ key: "available", value: "1", label: "المتوفر فقط" });
  if (params.get("sale")) chips.push({ key: "sale", value: "1", label: "عليها خصم" });
  if (params.get("min") || params.get("max")) chips.push({ key: "price", value: "", label: `السعر ${params.get("min") ?? "0"}–${params.get("max") ?? "∞"} ₪` });
  if (params.get("q")) chips.push({ key: "q", value: "", label: `«${params.get("q")}»` });
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key + c.value}
          type="button"
          onClick={() =>
            update((p) => {
              if (c.key === "price") {
                p.delete("min");
                p.delete("max");
              } else if (c.key === "size" || c.key === "color") {
                const rest = p.getAll(c.key).filter((v) => v !== c.value);
                p.delete(c.key);
                rest.forEach((v) => p.append(c.key, v));
              } else p.delete(c.key);
            })
          }
          className="inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 text-sm text-burgundy transition hover:bg-dusty/50"
          aria-label={`إزالة الفلتر ${c.label}`}
        >
          {c.label} <X className="size-3.5" />
        </button>
      ))}
      <button type="button" onClick={() => update((p) => ["size", "color", "available", "sale", "min", "max", "q"].forEach((k) => p.delete(k)))} className="text-sm text-muted underline-offset-4 hover:underline">
        مسح الكل
      </button>
    </div>
  );
}

export function FiltersSidebar({ facets }: { facets: Facets }) {
  return (
    <aside className="hidden lg:block" aria-label="الفلاتر">
      <div className="sticky top-24">
        <FilterBody facets={facets} />
      </div>
    </aside>
  );
}

export function FiltersSheetButton({ facets, count }: { facets: Facets; count: number }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-sm text-burgundy lg:hidden">
        <SlidersHorizontal className="size-4" /> الفلاتر
      </DialogTrigger>
      <SheetContent side="bottom" title="تصفية المنتجات">
        <div className="px-5 py-6">
          <FilterBody facets={facets} onDone={() => setOpen(false)} />
        </div>
        <div className="sticky bottom-0 border-t border-line bg-ivory p-4">
          <DialogClose asChild>
            <Button className="w-full">عرض {count} منتج</Button>
          </DialogClose>
        </div>
      </SheetContent>
    </Dialog>
  );
}
