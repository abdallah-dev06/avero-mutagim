"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { addOrderNote, openWhatsAppDraft, sendWhatsAppCloud, updateFulfillment, updateOrderStatus, updatePaymentStatus } from "@/app/admin/actions/orders";
import { Card } from "@/components/admin/admin-shell";
import { WhatsAppIcon } from "@/components/store/social-icons";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Textarea } from "@/components/ui/form";
import { Dialog, DialogContent } from "@/components/ui/sheet";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { ALL_STATUSES, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { renderTemplate, waMeLink } from "@/lib/whatsapp";

type OrderInfo = {
  id: string;
  reference: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  courierName: string | null;
  trackingCode: string | null;
  phone: string;
  customerName: string;
  total: number;
  whatsappOptIn: boolean;
  stockRestored: boolean;
  items: { productName: string; colorName: string; size: string; quantity: number }[];
};

export function OrderActions({
  order,
  transitions,
  templates,
  trackingLink,
  storeName,
  cloudEnabled,
}: {
  order: OrderInfo;
  transitions: OrderStatus[];
  templates: Record<string, string>;
  trackingLink: string;
  storeName: string;
  cloudEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [target, setTarget] = React.useState<OrderStatus | null>(null);
  const [note, setNote] = React.useState("");
  const [restock, setRestock] = React.useState(true);
  const [waStatus, setWaStatus] = React.useState<OrderStatus>(order.status);
  const [internalNote, setInternalNote] = React.useState("");

  const message = renderTemplate(templates[waStatus] ?? "", {
    name: order.customerName,
    reference: order.reference,
    status: waStatus,
    total: order.total,
    items: order.items,
    trackingLink,
    store: storeName,
  });

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(success);
        after?.();
        router.refresh();
      } else toast.error(res.error ?? "تعذّر الحفظ");
    });

  const confirmStatus = () => {
    if (!target) return;
    const to = target;
    run(
      async () => {
        const r = await updateOrderStatus({ orderId: order.id, to, note, restock: to === "RETURNED" ? restock : undefined });
        return r.ok ? { ok: true } : r;
      },
      `تم نقل الطلب إلى «${ORDER_STATUS_LABEL[to]}»`,
      () => {
        setTarget(null);
        setNote("");
        setWaStatus(to);
      },
    );
  };

  const openWhatsApp = () => {
    // Open synchronously (avoids popup blockers), then record that a DRAFT was opened.
    window.open(waMeLink(order.phone, message), "_blank", "noopener,noreferrer");
    start(async () => {
      const res = await openWhatsAppDraft(order.id, waStatus);
      if (!res.ok) toast.error(res.error);
      else toast("فُتحت مسودة واتساب — أكّدي الإرسال من داخل واتساب", { description: "لم يتم تسجيل الرسالة كمُرسلة." });
      router.refresh();
    });
  };

  return (
    <>
      <Card title="حالة الطلب">
        <div className="flex flex-wrap gap-2">
          {transitions.length ? (
            transitions.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === "CANCELLED" || s === "RETURNED" ? "secondary" : "primary"}
                className={cn(s === "CANCELLED" && "border-danger/40 text-danger hover:border-danger")}
                onClick={() => setTarget(s)}
                disabled={pending}
              >
                {ORDER_STATUS_LABEL[s]}
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted">هذه حالة نهائية — لا توجد انتقالات متاحة.</p>
          )}
        </div>
        {order.stockRestored && <p className="mt-3 text-xs text-muted">✓ أُعيدت كميات هذا الطلب إلى المخزون.</p>}

        <div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted">حالة الدفع</span>
            <select
              value={order.paymentStatus}
              onChange={(e) => run(() => updatePaymentStatus(order.id, e.target.value as PaymentStatus), "تم تحديث حالة الدفع")}
              disabled={pending}
              className="h-11 w-full rounded-xl border border-line bg-white px-3"
            >
              {Object.entries(PAYMENT_STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <form
            className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              run(() => updateFulfillment(order.id, { courierName: String(fd.get("courier")), trackingCode: String(fd.get("tracking")) }), "تم حفظ بيانات التوصيل");
            }}
          >
            <label>
              <span className="mb-1 block text-xs text-muted">شركة التوصيل</span>
              <Input name="courier" defaultValue={order.courierName ?? ""} className="h-11" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-muted">رقم الشحنة</span>
              <Input name="tracking" defaultValue={order.trackingCode ?? ""} className="h-11" dir="ltr" />
            </label>
            <Button type="submit" size="sm" variant="soft" className="h-11" disabled={pending}>
              حفظ
            </Button>
          </form>
        </div>
      </Card>

      <Card title="واتساب">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm">
            <span className="sr-only">قالب الرسالة</span>
            <select value={waStatus} onChange={(e) => setWaStatus(e.target.value as OrderStatus)} className="h-11 rounded-xl border border-line bg-white px-3">
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  رسالة: {ORDER_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <Button variant="whatsapp" size="sm" className="h-11" onClick={openWhatsApp} disabled={pending}>
            <WhatsAppIcon /> فتح واتساب
          </Button>
          {cloudEnabled && (
            <Button
              size="sm"
              variant="secondary"
              className="h-11"
              disabled={pending || !order.whatsappOptIn}
              title={order.whatsappOptIn ? "" : "الزبونة لم توافق على الرسائل التلقائية"}
              onClick={() => run(() => sendWhatsAppCloud(order.id), "قبلت منصة واتساب الرسالة — بانتظار تأكيد التسليم")}
            >
              <Send /> إرسال تلقائي (Cloud API)
            </Button>
          )}
        </div>
        <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap rounded-xl bg-[#effaf3] p-3 font-sans text-sm leading-relaxed text-ink" dir="rtl">
          {message}
        </pre>
        <p className="mt-2 text-xs text-muted">«فتح واتساب» يجهّز مسودة فقط؛ الإرسال الفعلي يتم من تطبيق واتساب ولا يُسجَّل كرسالة مُرسلة.</p>
      </Card>

      <Card title="ملاحظة داخلية">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => addOrderNote(order.id, internalNote), "أُضيفت الملاحظة", () => setInternalNote(""));
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={2} placeholder="لا تظهر للزبونة" className="min-h-12 flex-1" />
          <Button type="submit" variant="soft" disabled={pending || !internalNote.trim()}>
            إضافة
          </Button>
        </form>
      </Card>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent title={target ? `نقل الطلب إلى «${ORDER_STATUS_LABEL[target]}»` : ""}>
          <div className="space-y-4 p-5">
            {target === "CANCELLED" && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">سيتم إلغاء الطلب وإعادة كمياته إلى المخزون تلقائياً (مرة واحدة فقط). لا يمكن التراجع عن الإلغاء.</p>
            )}
            {target === "RETURNED" && (
              <Checkbox checked={restock} onChange={(e) => setRestock(e.target.checked)} label="إعادة القطع المرتجعة إلى المخزون (اختاري هذا فقط إن كانت القطع سليمة وقابلة للبيع)" disabled={order.stockRestored} />
            )}
            <label className="block text-sm">
              <span className="mb-1 block">ملاحظة (اختياري)</span>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setTarget(null)}>
                تراجع
              </Button>
              <Button onClick={confirmStatus} loading={pending} variant={target === "CANCELLED" ? "danger" : "primary"}>
                تأكيد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
