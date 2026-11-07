import { applyWebhook, verifyWebhookSignature, whatsappCloudConfigured } from "@/server/whatsapp-cloud";

/** Meta webhook verification handshake. */
export async function GET(req: Request) {
  if (!whatsappCloudConfigured()) return new Response("Not configured", { status: 404 });
  const u = new URL(req.url);
  if (u.searchParams.get("hub.mode") === "subscribe" && u.searchParams.get("hub.verify_token") === process.env.WHATSAPP_CLOUD_VERIFY_TOKEN) {
    return new Response(u.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/** Delivery status callbacks (sent / delivered / read / failed), signature-verified. */
export async function POST(req: Request) {
  if (!whatsappCloudConfigured()) return new Response("Not configured", { status: 404 });
  const raw = await req.text();
  if (raw.length > 1_000_000) return new Response("Too large", { status: 413 });
  if (!verifyWebhookSignature(raw, req.headers.get("x-hub-signature-256"))) return new Response("Invalid signature", { status: 401 });
  try {
    await applyWebhook(JSON.parse(raw));
  } catch (e) {
    console.error("whatsapp webhook", e);
  }
  return new Response("OK", { status: 200 });
}
