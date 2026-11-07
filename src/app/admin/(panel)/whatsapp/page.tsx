import { PageHeader, Card } from "@/components/admin/admin-shell";
import { TemplateEditor } from "@/components/admin/template-editor";
import { prisma } from "@/lib/db";
import { ALL_STATUSES, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { DEFAULT_WHATSAPP_TEMPLATES, TEMPLATE_PLACEHOLDERS } from "@/lib/whatsapp";
import { whatsappCloudConfigured } from "@/server/whatsapp-cloud";

export const metadata = { title: "قوالب واتساب" };

export default async function WhatsAppPage() {
  const rows = await prisma.whatsAppTemplate.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.status, r.body]));
  const cloud = whatsappCloudConfigured();
  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader title="قوالب رسائل واتساب" description="تُستخدم لتجهيز مسودات واتساب من صفحة الطلب. افتحي المسودة ثم اضغطي إرسال من داخل واتساب." />
      <Card title="المتغيرات المتاحة">
        <div className="flex flex-wrap gap-2 text-sm">
          {TEMPLATE_PLACEHOLDERS.map((p) => (
            <span key={p.key} className="rounded-full bg-blush px-3 py-1">
              <code className="latin">{p.key}</code> — {p.label}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          الإرسال التلقائي عبر WhatsApp Business Cloud API: {cloud ? "مُفعّل (يتطلب قالباً معتمداً من Meta وموافقة الزبونة)" : "غير مُفعّل — يتطلب بيانات اعتماد خاصة بالمتجر (راجعي README)."}
        </p>
      </Card>
      {ALL_STATUSES.map((s) => (
        <TemplateEditor key={s} status={s} label={ORDER_STATUS_LABEL[s]} initial={map[s] ?? DEFAULT_WHATSAPP_TEMPLATES[s]} fallback={DEFAULT_WHATSAPP_TEMPLATES[s]} />
      ))}
    </div>
  );
}
