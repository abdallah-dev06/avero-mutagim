"use client";

import * as React from "react";

type Datum = { key: string; label: string; value: number; display: string };

/** Single-series bar chart: one hue, thin rounded bars, per-column hover tooltip, table fallback. */
export function BarChart({ data, title, height = 180 }: { data: Datum[]; title: string; height?: number }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length || 1;
  const W = 600;
  const H = height;
  const pad = { top: 12, bottom: 22 };
  const plotH = H - pad.top - pad.bottom;
  const step = W / n;
  const barW = Math.max(2, Math.min(18, step - 2));
  const ticks = [...new Set([0, 0.5, 1].map((t) => Math.round(max * t)))];
  const labelEvery = Math.ceil(n / 8);

  return (
    <figure className="relative">
      <figcaption className="sr-only">{title}</figcaption>
      <div className="relative" dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title} onMouseLeave={() => setHover(null)}>
          {ticks.map((t, ti) => {
            const y = pad.top + plotH - (t / max) * plotH;
            return <line key={ti} x1={0} x2={W} y1={y} y2={y} stroke="#ead9de" strokeWidth={1} strokeDasharray={t === 0 ? undefined : "3 4"} />;
          })}
          {data.map((d, i) => {
            const h = d.value > 0 ? Math.max(2, (d.value / max) * plotH) : 0;
            const x = i * step + (step - barW) / 2;
            const y = pad.top + plotH - h;
            const r = Math.min(4, barW / 2, h);
            return (
              <g key={d.key}>
                {h > 0 && (
                  <path
                    d={`M${x},${pad.top + plotH} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + barW - r},${y} Q${x + barW},${y} ${x + barW},${y + r} L${x + barW},${pad.top + plotH} Z`}
                    fill={hover === null || hover === i ? "#4B1F34" : "#8B4B65"}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                )}
                {i % labelEvery === 0 && (
                  <text x={i * step + step / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#6c5561">
                    {d.label}
                  </text>
                )}
                <rect x={i * step} y={0} width={step} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} />
              </g>
            );
          })}
        </svg>
        {hover !== null && data[hover] && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs shadow-[var(--shadow-soft)]"
            style={{ left: `${((hover + 0.5) / n) * 100}%` }}
          >
            <p className="text-muted">{data[hover].label}</p>
            <p className="font-bold text-ink">{data[hover].display}</p>
          </div>
        )}
      </div>
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer">عرض كجدول</summary>
        <table className="mt-2 w-full text-right">
          <tbody>
            {data.map((d) => (
              <tr key={d.key} className="border-t border-line/60">
                <td className="py-1">{d.label}</td>
                <td className="latin py-1">{d.display}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
