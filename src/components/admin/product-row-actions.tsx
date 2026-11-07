"use client";

import { Archive, Copy, Eye, EyeOff, MoreVertical, Pencil, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import * as React from "react";
import { toast } from "sonner";
import { deleteProduct, duplicateProductAction, setProductStatus } from "@/app/admin/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Dialog, DialogContent } from "@/components/ui/sheet";

export function ProductRowActions({ id, name, status, variant = "menu" }: { id: string; name: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; variant?: "menu" | "bar" }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [delOpen, setDelOpen] = React.useState(false);
  const [confirmName, setConfirmName] = React.useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string; id?: string }>, msg: string, after?: (r: { id?: string }) => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(msg);
        after?.(r);
        router.refresh();
      } else toast.error(r.error);
    });

  const actions = [
    status !== "PUBLISHED" && status !== "ARCHIVED" && { label: "نشر", icon: Eye, onSelect: () => run(() => setProductStatus(id, "PUBLISHED"), "تم النشر") },
    status === "PUBLISHED" && { label: "إلغاء النشر", icon: EyeOff, onSelect: () => run(() => setProductStatus(id, "DRAFT"), "أصبح المنتج مسودة") },
    { label: "نسخ المنتج", icon: Copy, onSelect: () => run(() => duplicateProductAction(id), "تم إنشاء نسخة (مسودة بمخزون 0)", (r) => r.id && router.push(`/admin/products/${r.id}`)) },
    status !== "ARCHIVED" && { label: "أرشفة", icon: Archive, onSelect: () => run(() => setProductStatus(id, "ARCHIVED"), "تمت الأرشفة") },
    status === "ARCHIVED" && { label: "استعادة كمسودة", icon: RotateCcw, onSelect: () => run(() => setProductStatus(id, "DRAFT"), "تمت الاستعادة") },
    { label: "حذف نهائي", icon: Trash2, danger: true, onSelect: () => setDelOpen(true) },
  ].filter(Boolean) as { label: string; icon: typeof Eye; onSelect: () => void; danger?: boolean }[];

  return (
    <>
      {variant === "menu" ? (
        <DropdownMenu.Root dir="rtl">
          <DropdownMenu.Trigger className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-blush" aria-label={`إجراءات ${name}`} disabled={pending}>
            <MoreVertical className="size-4" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={4} className="z-50 min-w-44 rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-lift)]">
              <DropdownMenu.Item asChild>
                <Link href={`/admin/products/${id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-blush">
                  <Pencil className="size-4" /> تعديل
                </Link>
              </DropdownMenu.Item>
              {actions.map((a) => (
                <DropdownMenu.Item key={a.label} onSelect={a.onSelect} className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-blush ${a.danger ? "text-danger" : ""}`}>
                  <a.icon className="size-4" /> {a.label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ) : (
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <Button key={a.label} size="sm" variant={a.danger ? "ghost" : "secondary"} className={a.danger ? "text-danger" : ""} onClick={a.onSelect} disabled={pending}>
              <a.icon /> {a.label}
            </Button>
          ))}
        </div>
      )}

      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent title="حذف المنتج نهائياً">
          <div className="space-y-4 p-5 text-sm">
            <p>لا يمكن التراجع عن الحذف. المنتجات الموجودة في طلبات سابقة لا تُحذف — استخدمي الأرشفة بدلاً من ذلك.</p>
            <label className="block">
              <span className="mb-1 block">للتأكيد اكتبي اسم المنتج: «{name}»</span>
              <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDelOpen(false)}>
                إلغاء
              </Button>
              <Button
                variant="danger"
                loading={pending}
                disabled={confirmName.trim() !== name.trim()}
                onClick={() =>
                  run(() => deleteProduct(id, confirmName), "تم حذف المنتج", () => {
                    setDelOpen(false);
                    router.push("/admin/products");
                  })
                }
              >
                حذف نهائي
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
