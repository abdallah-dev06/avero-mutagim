"use client";

import { Info, Ruler, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { findSize, type ChartRow, type FitResult } from "@/lib/sizes";
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
    <div>
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

export function SizeFinder({ chart, availableSizes, onResult }: { chart: SizeChartData; availableSizes?: string[]; onResult?: (key: string | null) => void }) {
  const [m, setM] = React.useState({ bust: "", waist: "", hips: "" });
  const [result, setResult] = React.useState<FitResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const vals = {
      bust: m.bust ? Number(m.bust) : undefined,
      waist: m.waist ? Number(m.waist) : undefined,
      hips: m.hips ? Number(m.hips) : undefined,
    };
    const bad = Object.values(vals).some((v) => v != null && (!Number.isFinite(v) || v < 40 || v > 220));
    if (bad) {
      setError("أدخلي قياسات منطقية بالسنتيمتر (بين 40 و220).");
      setResult(null);
      return;
    }
    setError(null);
    const r = findSize(chart.rows, vals);
    setResult(r);
    onResult?.(r.kind === "match" ? (r.row.euSize ? `${r.row.label}-${r.row.euSize}` : r.row.label) : null);
  };

  const fields = [
    { key: "bust", label: "محيط الصدر", hint: "حول أعرض جزء من الصدر" },
    { key: "waist", label: "محيط الخصر", hint: "حول أضيق جزء من الخصر" },
    { key: "hips", label: "محيط الأرداف", hint: "حول أعرض جزء من الأرداف" },
  ] as const;

  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-blush text-burgundy">
          <Ruler className="size-5" />
        </span>
        <div>
          <h3 className="font-medium text-burgundy">اعرفي مقاسك</h3>
          <p className="text-xs text-muted">أدخلي قياسات جسمك بالسنتيمتر (قياس واحد على الأقل)</p>
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3" noValidate>
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-sm font-medium">{f.label}</span>
            <span className="relative block">
              <input
                inputMode="decimal"
                value={m[f.key]}
                onChange={(e) => setM((s) => ({ ...s, [f.key]: e.target.value.replace(/[^\d.]/g, "") }))}
                className="h-12 w-full rounded-xl border border-line bg-ivory/50 pe-4 ps-12 text-[16px] focus:border-mauve focus:outline-none"
                aria-describedby={`${f.key}-hint`}
              />
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">سم</span>
            </span>
            <span id={`${f.key}-hint`} className="mt-1 block text-[11px] text-muted">
              {f.hint}
            </span>
          </label>
        ))}
        <Button type="submit" className="sm:col-span-3">
          اقترحي لي المقاس
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div key={JSON.stringify(result)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4" role="status" aria-live="polite">
            <FitMessage result={result} availableSizes={availableSizes} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FitMessage({ result, availableSizes }: { result: FitResult; availableSizes?: string[] }) {
  if (result.kind === "insufficient") return <p className="rounded-xl bg-blush p-4 text-sm text-burgundy">أدخلي قياساً واحداً على الأقل.</p>;
  if (result.kind === "too-large") {
    return (
      <div className="rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
        <p className="font-medium">قياساتك أكبر من أكبر مقاس في هذا الجدول ({result.largest.label}).</p>
        <p className="mt-1">لا نستطيع ضمان المقاس المناسب — تواصلي معنا عبر واتساب لنساعدك في اختيار قصّة واسعة أو موديل مناسب.</p>
        <Comparisons items={result.comparisons} />
      </div>
    );
  }
  const notAvailable = availableSizes && !availableSizes.includes(result.row.label);
  return (
    <div className="rounded-xl bg-blush p-4 text-sm leading-relaxed text-burgundy">
      <p>
        المقاس المقترح: <strong className="latin text-lg">{result.row.label}</strong>
        {result.row.euSize && <span className="text-muted"> (أوروبي {result.row.euSize})</span>}
      </p>
      <p className="mt-1 text-ink/80">أصغر مقاس تتجاوز قياساته جميع قياساتك. هذا اقتراح تقريبي وليس ضماناً للمقاس.</p>
      {result.between && <p className="mt-1 text-ink/80">لاحظنا فرقاً واضحاً بين قياساتك؛ إن كنتِ تفضّلين قصّة أضيق قد يناسبك مقاس أصغر في بعض الموديلات.</p>}
      {notAvailable && <p className="mt-1 font-medium text-danger">هذا المقاس غير متوفر في هذا المنتج حالياً.</p>}
      <Comparisons items={result.comparisons} />
    </div>
  );
}

function Comparisons({ items }: { items: { label: string; yours: number; chart: number; ok: boolean }[] }) {
  return (
    <ul className="mt-3 grid gap-1.5">
      {items.map((c) => (
        <li key={c.label} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs text-ink">
          <span>{c.label}</span>
          <span className="latin">
            {c.yours} cm {c.ok ? "≤" : ">"} {c.chart} cm
          </span>
        </li>
      ))}
    </ul>
  );
}
