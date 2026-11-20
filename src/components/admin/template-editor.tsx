"use client";

import * as React from "react";
import { toast } from "sonner";
import { saveWhatsAppTemplate } from "@/app/admin/actions/content";
import { Card } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import type { OrderStatus } from "@/generated/prisma/enums";
import { renderTemplate } from "@/lib/whatsapp";

export function TemplateEditor({ status, label, initial, fallback }: { status: OrderStatus; label: string; initial: string; fallback: string }) {
  const [body, setBody] = React.useState(initial);
  const [saved, setSaved] = React.useState(initial);
  const [pending, start] = React.useTransition();
  const preview = renderTemplate(body, {
    name: "محمد أحمد",
    reference: "AV-ABCD-1234",
    status,
    total: 18900,
    items: [{ productName: "قميص كلاسيك إيطالي", colorName: "أبيض", size: "L", quantity: 1 }],
    trackingLink: "https://example.com/order/AV-ABCD-1234",
    store: "AVERO MUTAGIM",
  });
  return (
    <Card title={label}>
      <div className="grid gap-4 md:grid-cols-2">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} aria-label={`قالب ${label}`} />
        <pre className="whitespace-pre-wrap rounded-xl bg-[#effaf3] p-3 font-sans text-sm leading-relaxed" aria-label="معاينة">
          {preview}
        </pre>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setBody(fallback)} disabled={pending}>
          استعادة الافتراضي
        </Button>
        <Button
          size="sm"
          disabled={pending || body === saved}
          loading={pending}
          onClick={() =>
            start(async () => {
              const r = await saveWhatsAppTemplate(status, body);
              if (r.ok) {
                setSaved(body);
                toast.success("تم حفظ القالب");
              } else toast.error(r.error);
            })
          }
        >
          حفظ
        </Button>
      </div>
    </Card>
  );
}
