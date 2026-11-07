"use client";

import { CheckCircle2, ChevronDown, Info, Ruler, Search, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { estimateMeasurementsFromWeightAndHeight, findSize, type ChartRow, type FitResult } from "@/lib/sizes";
import { cn } from "@/lib/utils";

export type SizeChartData = { name: string; description: string | null; measurementType: string; rows: ChartRow[] };

export function SizeChartTable({ chart, highlight, availableSizes }: { chart: SizeChartData; highlight?: string | null; availableSizes?: string[] }) {
  const [q, setQ] = React.useState("");
  const query = q.trim().toUpperCase();
  const rows = chart.rows.filter((r) => {
    if (!query) return true;
    const n = Number(query);
    if (Number.isFinite(n) && n > 60) {
      return [r.bustCm, r.waistCm, r.hipsCm].some((v) => v != null && Math.abs(v - n) <= 3);
    }
    return r.label.toUpperCase().includes(query) || (r.euSize ?? "").includes(query);
  });
  return (
    <div id="size-chart-table" className="pt-2">
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحثي بالمقاس (M) أو الرقم الأوروبي (40) أو قياس بالسم (98)"
          aria-label="البحث في جدول المقاسات"
          className="h-12 w-full rounded-xl border border-line bg-white pe-4 ps-11 text-[16px] placeholder:text-sm focus:border-mauve focus:outline-none"
          style={{ paddingInlineStart: "2.75rem" }}
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white" tabIndex={0} role="region" aria-label={`جدول ${chart.name}`}>
        <table className="w-full min-w-[440px] border-collapse text-center text-sm">
          <caption className="sr-only">{chart.name} — القياسات بالسنتيمتر</caption>
          <thead>
            <tr className="bg-blush text-burgundy">
              <th scope="col" className="sticky right-0 bg-blush px-3 py-3 font-bold">المقاس</th>
              <th scope="col" className="px-3 py-3 font-medium">أوروبي</th>
              <th scope="col" className="px-3 py-3 font-medium">الصدر</th>
              <th scope="col" className="px-3 py-3 font-medium">الخصر</th>
              <th scope="col" className="px-3 py-3 font-medium">الأرداف</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const hl = highlight && (r.euSize ? `${r.label}-${r.euSize}` : r.label) === highlight;
              const unavailable = availableSizes && !availableSizes.includes(r.label);
              return (
                <tr key={i} className={cn("border-t border-line/70 transition-colors", hl ? "bg-burgundy text-ivory" : i % 2 ? "bg-ivory/60" : "bg-white", unavailable && !hl && "text-muted")}>
                  <th scope="row" className={cn("latin sticky right-0 px-3 py-3 font-bold", hl ? "bg-burgundy" : i % 2 ? "bg-[#fcfaf9]" : "bg-white")}>
                    {r.label}
                  </th>
                  <td className="latin px-3 py-3">{r.euSize ?? "—"}</td>
                  <td className="latin px-3 py-3">{r.bustCm ?? "—"}</td>
                  <td className="latin px-3 py-3">{r.waistCm ?? "—"}</td>
                  <td className="latin px-3 py-3">{r.hipsCm ?? "—"}</td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-muted">
                  لا توجد نتائج مطابقة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {chart.measurementType === "GARMENT"
          ? "القياسات بالسنتيمتر وهي قياسات القطعة نفسها (وليست قياسات الجسم)."
          : "القياسات بالسنتيمتر وهي قياسات الجسم، وليست قياسات القطعة. قد تختلف القصّات بين الموديلات."}
        {chart.description ? ` ${chart.description}` : ""}
      </p>
    </div>
  );
}

type Mode = "measurements" | "weightHeight";

export function SizeFinder({
  chart,
  availableSizes,
  onResult,
}: {
  chart: SizeChartData;
  availableSizes?: string[];
  onResult?: (key: string | null) => void;
}) {
  const [mode, setMode] = React.useState<Mode>("measurements");

  // Measurements mode (defaults matching standard luxury female silhouette)
  const [bust, setBust] = React.useState<number>(95);
  const [waist, setWaist] = React.useState<number>(78);
  const [hips, setHips] = React.useState<number>(102);

  // Weight & Height mode
  const [weight, setWeight] = React.useState<number>(65);
  const [height, setHeight] = React.useState<number>(165);

  const [result, setResult] = React.useState<FitResult | null>(null);

  const calculate = () => {
    let vals: { bust: number; waist: number; hips: number };
    if (mode === "measurements") {
      vals = { bust, waist, hips };
    } else {
      vals = estimateMeasurementsFromWeightAndHeight(weight, height);
    }
    const r = findSize(chart.rows, vals);
    setResult(r);
    onResult?.(r.kind === "match" ? (r.row.euSize ? `${r.row.label}-${r.row.euSize}` : r.row.label) : null);
  };

  const scrollToTable = () => {
    const el = document.getElementById("size-chart-table");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-gold/30 bg-gradient-to-b from-[#2e1321] via-[#3a192b] to-[#250d19] p-5 text-ivory shadow-[0_12px_40px_rgba(45,18,32,0.45)] sm:p-8">
      {/* Subtle decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-gold/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-20 size-60 rounded-full bg-mauve/20 blur-3xl"
      />

      {/* Header */}
      <div className="relative text-center">
        <h2 className="text-2xl font-bold tracking-tight text-ivory sm:text-3xl">قياساتك</h2>
        <p className="mt-2 text-xs text-ivory/70 sm:text-sm">
          للنتيجة الأدقّ استخدمي القياسات الفعلية بشريط القياس
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="relative mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/35 p-1.5">
        <button
          type="button"
          onClick={() => setMode("measurements")}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl px-3 py-2.5 transition-all duration-300",
            mode === "measurements"
              ? "scale-[1.01] bg-gradient-to-b from-[#f3e5ab] via-[#dfb652] to-[#b88a6a] font-bold text-burgundy-950 shadow-md"
              : "text-ivory/70 hover:text-ivory",
          )}
        >
          <span className="text-sm font-bold sm:text-base">بالقياسات</span>
          <span
            className={cn(
              "mt-0.5 flex items-center gap-1 text-[11px] font-medium",
              mode === "measurements" ? "text-burgundy-900" : "text-dusty",
            )}
          >
            الأدقّ ✅
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode("weightHeight")}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl px-3 py-2.5 transition-all duration-300",
            mode === "weightHeight"
              ? "scale-[1.01] bg-gradient-to-b from-[#f3e5ab] via-[#dfb652] to-[#b88a6a] font-bold text-burgundy-950 shadow-md"
              : "text-ivory/70 hover:text-ivory",
          )}
        >
          <span className="text-sm font-bold sm:text-base">بالوزن والطول</span>
          <span
            className={cn(
              "mt-0.5 text-[11px] font-medium",
              mode === "weightHeight" ? "text-burgundy-900" : "text-dusty",
            )}
          >
            تقديري
          </span>
        </button>
      </div>

      {/* Sliders Area */}
      <div className="relative mt-7 space-y-5">
        {mode === "measurements" ? (
          <>
            <SliderRow
              label="محيط الصدر"
              value={bust}
              min={70}
              max={150}
              unit="سم"
              onChange={setBust}
            />
            <SliderRow
              label="محيط الخصر"
              value={waist}
              min={55}
              max={140}
              unit="سم"
              onChange={setWaist}
            />
            <SliderRow
              label="محيط الأرداف"
              value={hips}
              min={75}
              max={160}
              unit="سم"
              onChange={setHips}
            />
          </>
        ) : (
          <>
            <SliderRow
              label="الوزن"
              value={weight}
              min={40}
              max={140}
              unit="كغ"
              onChange={setWeight}
            />
            <SliderRow
              label="الطول"
              value={height}
              min={140}
              max={195}
              unit="سم"
              onChange={setHeight}
            />
            {(() => {
              const est = estimateMeasurementsFromWeightAndHeight(weight, height);
              return (
                <div className="rounded-xl border border-gold/20 bg-black/20 p-2.5 text-center text-xs text-dusty">
                  القياسات التقديرية لجسمك: الصدر ~{est.bust} سم · الخصر ~{est.waist} سم · الأرداف ~{est.hips} سم
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Action Button: احسبي مقاسي ✨ */}
      <div className="relative mt-8">
        <button
          type="button"
          onClick={calculate}
          className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f3e5ab] via-[#e2b755] to-[#c5952f] py-4 px-6 text-base font-bold text-burgundy-950 shadow-[0_6px_25px_rgba(212,175,55,0.35)] transition-all hover:brightness-105 active:scale-[0.99] sm:text-lg"
        >
          <Sparkles className="size-5 transition-transform group-hover:rotate-12" />
          <span>احسبي مقاسي</span>
          <Sparkles className="size-5 transition-transform group-hover:-rotate-12" />
        </button>
      </div>

      {/* Secondary Button: جدول المقاسات 📐 */}
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={scrollToTable}
          className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-ivory/5 px-6 py-2 text-xs font-medium text-ivory/90 transition hover:border-gold/60 hover:bg-ivory/10 sm:text-sm"
        >
          <span>جدول المقاسات</span>
          <span className="text-base">📐</span>
        </button>
      </div>

      {/* Result Card */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={JSON.stringify(result)}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
            role="status"
            aria-live="polite"
          >
            <FitMessage result={result} availableSizes={availableSizes} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm sm:text-base">
        <span className="font-semibold text-ivory/90">{label}</span>
        <span className="latin flex items-baseline gap-1 text-base font-bold text-gold sm:text-lg">
          <span>{value}</span>
          <span className="text-xs text-dusty">{unit}</span>
        </span>
      </div>
      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="lux-slider relative z-10 h-2.5 w-full cursor-pointer rounded-full"
          style={{
            background: `linear-gradient(to left, #dfb652 0%, #b88a6a ${pct}%, rgba(255, 255, 255, 0.12) ${pct}%, rgba(255, 255, 255, 0.12) 100%)`,
          }}
        />
      </div>
    </div>
  );
}

function FitMessage({ result, availableSizes }: { result: FitResult; availableSizes?: string[] }) {
  if (result.kind === "insufficient") {
    return (
      <div className="rounded-2xl border border-gold/30 bg-black/40 p-5 text-center text-sm text-ivory">
        يرجى تحديد القياسات المطلوبة.
      </div>
    );
  }

  if (result.kind === "too-large") {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-950/40 p-5 text-sm leading-relaxed text-amber-200">
        <p className="font-bold text-amber-100">
          قياساتك أكبر من أكبر مقاس في هذا الجدول ({result.largest.label}).
        </p>
        <p className="mt-1 text-xs text-amber-200/80">
          تواصلي معنا عبر واتساب لمساعدتك في اختيار موديل بقصّة واسعة وراحة أكبر.
        </p>
        <Comparisons items={result.comparisons} />
      </div>
    );
  }

  const notAvailable = availableSizes && !availableSizes.includes(result.row.label);

  return (
    <div className="rounded-2xl border border-gold/40 bg-black/50 p-5 leading-relaxed text-ivory shadow-xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs text-dusty">المقاس المقترح لجسمك:</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="latin text-2xl font-bold text-gold sm:text-3xl">{result.row.label}</span>
            {result.row.euSize && (
              <span className="rounded-md bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold">
                أوروبي {result.row.euSize}
              </span>
            )}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
          <CheckCircle2 className="size-3.5" />
          مطابق للجدول
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ivory/80">
        هذا المقاس هو الأنسب استناداً إلى أبعاد الصدر والخصر والأرداف لضمان الراحة والأناقة.
      </p>

      {result.between && (
        <p className="mt-2 text-xs text-dusty">
          ✨ لاحظنا تفاوتاً لطيفاً في قياساتك، إذا كنتِ تفضلين إطلالة ضيقة ومحددة قد يناسبك المقاس الأصغر في بعض القصّات.
        </p>
      )}

      {notAvailable && (
        <p className="mt-2 text-xs font-medium text-rose-300">
          ⚠️ تنبيه: هذا المقاس غير متوفر في هذه القطعة حالياً.
        </p>
      )}

      <Comparisons items={result.comparisons} />
    </div>
  );
}

function Comparisons({ items }: { items: { label: string; yours: number; chart: number; ok: boolean }[] }) {
  return (
    <div className="mt-4 grid gap-2">
      <p className="text-[11px] font-medium text-ivory/60">مقارنة قياساتك مع أبعاد المقاس:</p>
      <div className="grid grid-cols-3 gap-2">
        {items.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center text-xs"
          >
            <p className="text-[11px] text-dusty">{c.label}</p>
            <p className="latin mt-1 font-bold text-ivory">
              {c.yours} <span className="text-[10px] text-ivory/60">سم</span>
            </p>
            <span
              className={cn(
                "mt-1 inline-block text-[10px] font-medium",
                c.ok ? "text-emerald-400" : "text-amber-400",
              )}
            >
              {c.ok ? "مناسب" : "أضيق"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
