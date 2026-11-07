export const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "ONE SIZE"];

export function sortSizes<T extends string>(sizes: T[]): T[] {
  const rank = (s: string) => {
    const i = SIZE_ORDER.indexOf(s.toUpperCase());
    if (i >= 0) return i;
    const n = Number(s);
    return Number.isFinite(n) ? 100 + n : 1000;
  };
  return [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export type ChartRow = {
  label: string;
  euSize: string | null;
  bustCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
};

export type Measurements = { bust?: number; waist?: number; hips?: number };

export type FitResult =
  | { kind: "match"; row: ChartRow; comparisons: Comparison[]; between: boolean }
  | { kind: "too-large"; largest: ChartRow; comparisons: Comparison[] }
  | { kind: "insufficient" };

export type Comparison = { key: "bust" | "waist" | "hips"; label: string; yours: number; chart: number; ok: boolean; diff: number };

const LABELS = { bust: "الصدر", waist: "الخصر", hips: "الأرداف" } as const;

function compare(row: ChartRow, m: Measurements): Comparison[] {
  const out: Comparison[] = [];
  for (const key of ["bust", "waist", "hips"] as const) {
    const yours = m[key];
    const chart = row[`${key}Cm` as const];
    if (yours == null || chart == null) continue;
    out.push({ key, label: LABELS[key], yours, chart, ok: yours <= chart, diff: chart - yours });
  }
  return out;
}

/**
 * Suggest the smallest chart row whose body measurements are ≥ every measurement
 * provided. Rows are assumed sorted from smallest to largest. Never guarantees fit.
 */
export function findSize(rows: ChartRow[], m: Measurements): FitResult {
  const provided = (["bust", "waist", "hips"] as const).filter((k) => m[k] != null && m[k]! > 0);
  if (provided.length === 0 || rows.length === 0) return { kind: "insufficient" };
  for (const row of rows) {
    const comparisons = compare(row, m);
    if (comparisons.length > 0 && comparisons.every((c) => c.ok)) {
      // "between": a measurement fits a much smaller size → proportions differ (e.g. narrow waist, wider hips)
      const between = comparisons.some((c) => c.diff >= 8);
      return { kind: "match", row, comparisons, between };
    }
  }
  const largest = rows[rows.length - 1];
  return { kind: "too-large", largest, comparisons: compare(largest, m) };
}
