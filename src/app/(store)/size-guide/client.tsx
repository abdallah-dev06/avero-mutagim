"use client";

import * as React from "react";
import { SizeChartTable, SizeFinder, type SizeChartData } from "@/components/store/size-guide";
import { cn } from "@/lib/utils";

export function SizeGuidePageClient({ charts }: { charts: (SizeChartData & { id: string })[] }) {
  const [active, setActive] = React.useState(charts[0].id);
  const [hl, setHl] = React.useState<string | null>(null);
  const chart = charts.find((c) => c.id === active) ?? charts[0];
  return (
    <div className="space-y-6">
      {charts.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label="جداول المقاسات">
          {charts.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === active}
              onClick={() => {
                setActive(c.id);
                setHl(null);
              }}
              className={cn("shrink-0 rounded-full px-4 py-2 text-sm transition", c.id === active ? "bg-burgundy text-ivory" : "bg-blush text-burgundy")}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      <SizeFinder chart={chart} onResult={setHl} />
      <SizeChartTable chart={chart} highlight={hl} />
    </div>
  );
}
