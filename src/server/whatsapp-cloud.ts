import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { OrderStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { waDigits } from "@/lib/phone";
import { DomainError } from "@/server/errors";

/**
 * Official WhatsApp Business Platform (Cloud API) integration.
 * Disabled unless the merchant provides their own credentials. Requires:
 *  - a Meta-approved message template (default name: order_status_update, language: ar)
 *    with 3 body parameters: {{1}} customer name, {{2}} order reference, {{3}} status label
 *  - customer opt-in (captured at checkout)
 * Message status is ONLY updated from Meta's signed webhooks — never assumed.
 */
export function whatsappCloudConfigured() {
  const e = process.env;
  return !!(e.WHATSAPP_CLOUD_ACCESS_TOKEN && e.WHATSAPP_CLOUD_PHONE_NUMBER_ID && e.WHATSAPP_CLOUD_APP_SECRET && e.WHATSAPP_CLOUD_VERIFY_TOKEN);
}

export async function sendWhatsAppTemplate(input: { orderId: string; to: string; status: OrderStatus; reference: string; name: string }) {
  if (!whatsappCloudConfigured()) throw new DomainError("WhatsApp Cloud API غير مُعدّ");
  const version = process.env.WHATSAPP_CLOUD_API_VERSION || "v21.0";
  const template = process.env.WHATSAPP_CLOUD_TEMPLATE_NAME || "order_status_update";
  const lang = process.env.WHATSAPP_CLOUD_TEMPLATE_LANG || "ar";
  const record = await prisma.whatsAppMessage.create({ data: { orderId: input.orderId, toPhone: input.to, template, status: "PENDING" } });
  const res = await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: waDigits(input.to),
      type: "template",
      template: {
        name: template,
        language: { code: lang },
        components: [{ type: "body", parameters: [input.name, input.reference, ORDER_STATUS_LABEL[input.status]].map((text) => ({ type: "text", text })) }],
      },
    }),
    signal: AbortSignal.timeout(15000),
  }).catch((e: unknown) => {
    return { ok: false, status: 0, json: async () => ({ error: { message: String(e) } }) } as unknown as Response;
  });
  const body = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string } };
  if (!res.ok || !body.messages?.[0]?.id) {
    const error = body.error?.message?.slice(0, 300) ?? `HTTP ${res.status}`;
    await prisma.whatsAppMessage.update({ where: { id: record.id }, data: { status: "FAILED", error } });
    throw new DomainError(`رفضت منصة واتساب الطلب: ${error}`);
  }
  // "ACCEPTED" = Meta accepted the request. Delivery is confirmed later by webhook.
  await prisma.whatsAppMessage.update({ where: { id: record.id }, data: { status: "ACCEPTED", waMessageId: body.messages[0].id } });
  return { messageId: body.messages[0].id };
}

export function verifyWebhookSignature(rawBody: string, header: string | null) {
  const secret = process.env.WHATSAPP_CLOUD_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const got = Buffer.from(header.slice(7));
  return expected.length === got.length && timingSafeEqual(expected, got);
}

type WebhookPayload = {
  entry?: { changes?: { value?: { statuses?: { id: string; status: string; errors?: { title?: string; message?: string }[] }[] } }[] }[];
};

const RANK: Record<string, number> = { PENDING: 0, ACCEPTED: 1, SENT: 2, DELIVERED: 3, READ: 4, FAILED: 5 };

export async function applyWebhook(payload: WebhookPayload) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const s of change.value?.statuses ?? []) {
        const status = s.status.toUpperCase();
        if (!(status in RANK)) continue;
        const msg = await prisma.whatsAppMessage.findUnique({ where: { waMessageId: s.id } });
        if (!msg || (RANK[msg.status] ?? 0) >= RANK[status]) continue; // ignore out-of-order callbacks
        await prisma.whatsAppMessage.update({
          where: { id: msg.id },
          data: { status, error: status === "FAILED" ? (s.errors?.[0]?.message ?? s.errors?.[0]?.title ?? "failed").slice(0, 300) : null },
        });
      }
    }
  }
}
