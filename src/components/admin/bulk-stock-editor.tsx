"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { bulkUpdateStock, toggleVariantActive } from "@/app/admin/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";

type Row = { id: string; productId: string; product: string; draft: boolean; color: string; hex: string; size: string; sku: string; stock: number; isActive: boolean; low: number };

export function BulkStockEditor({ rows, threshold }: { rows: Row[]; threshold: number }) {
  const router = useRouter();
  const [edits, setEdits] = React.useState<Record<string, number>>({});
  const [reason, setReason] = React.useState("");
  const [pending, start] = React.useTransition();
  const changed = Object.entries(edits).filter(([id, v]) => rows.find((r) => r.id === id)?.stock !== v);

  const save = () => {
    if (!reason.trim()) return toast.error("اكتب سبب التعديل (مثال: جرد، بضاعة جديدة)");
    start(async () => {
      const res = await bulkUpdateStock(
        changed.map(([variantId, stock]) => ({ variantId, stock, base: rows.find((r) => r.id === variantId)!.stock })),
        reason,
      );
      if (!res.ok) return void toast.error(res.error);
      if (res.failed.length) toast.error(`تعذّر تحديث ${res.failed.length} عنصر — حدّثي الصفحة`, { description: res.failed[0] });
      toast.success(`تم تحديث ${res.updated} عنصر`);
      setEdits({});
      setReason("");
      router.refresh();
    });
  };

  if (!rows.length) return <p className="rounded-2xl border border-line bg-white p-10 text-center text-muted">لا توجد عناصر.</p>;

  return (
    <div className="rounded-2xl border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-blush/60 text-right text-xs text-burgundy">
            <tr>
              <th className="px-4 py-3 font-medium">المنتج</th>
              <th className="px-4 py-3 font-medium">اللون / المقاس</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">الحالي</th>
              <th className="px-4 py-3 font-medium">الكمية الجديدة</th>
              <th className="px-4 py-3 font-medium">متاح للبيع</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const val = edits[r.id] ?? r.stock;
              const dirty = val !== r.stock;
              return (
                <tr key={r.id} className={cn("border-t border-line/60", dirty && "bg-amber-50/60", !r.isActive && "text-muted")}>
                  <td className="px-4 py-2">
                    <Link href={`/admin/products/${r.productId}`} className="hover:text-burgundy">
                      {r.product}
                    </Link>
                    {r.draft && <span className="ms-1 text-xs text-amber-700">(مسودة)</span>}
                  </td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-1.5">
                      <span className="size-3.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: r.hex }} />
                      {r.color} / <span className="latin">{r.size}</span>
                    </span>
                  </td>
                  <td className="latin px-4 py-2 text-xs">{r.sku}</td>
                  <td className="px-4 py-2">
                    <span className={cn("latin rounded-full px-2 py-0.5 text-xs font-bold", r.stock === 0 ? "bg-rose-50 text-danger" : r.stock <= r.low ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900")}>{r.stock}</span>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={val}
                      onChange={(e) => setEdits((x) => ({ ...x, [r.id]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))}
                      className="h-9 w-24 rounded-lg border border-line px-2 text-[16px]"
                      aria-label={`الكمية الجديدة ${r.product} ${r.color} ${r.size}`}
                    />
                    {dirty && <span className="latin ms-2 text-xs text-mauve">{val - r.stock > 0 ? "+" : ""}{val - r.stock}</span>}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      className="size-5 accent-burgundy"
                      defaultChecked={r.isActive}
                      aria-label="متاح للبيع"
                      onChange={(e) =>
                        start(async () => {
                          const res = await toggleVariantActive(r.id, e.target.checked);
                          if (!res.ok) toast.error(res.error);
                          router.refresh();
                        })
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-line bg-white p-3">
        <span className="text-sm text-muted">{changed.length} تعديل غير محفوظ · التنبيه عند ≤ {threshold}</span>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب التعديل (إلزامي)" className="h-10 max-w-xs flex-1" aria-label="سبب التعديل" />
        <Button size="sm" onClick={save} loading={pending} disabled={!changed.length}>
          حفظ التعديلات
        </Button>
        {changed.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => setEdits({})}>
            تراجع
          </Button>
        )}
      </div>
    </div>
  );
}
