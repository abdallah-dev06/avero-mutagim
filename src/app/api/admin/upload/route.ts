import { audit } from "@/lib/audit";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, storeImage } from "@/lib/storage";
import { DomainError } from "@/server/errors";

/** Authenticated, same-origin image upload. Validates size/type/content and re-encodes to WebP. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!isStaff(user)) return Response.json({ error: "غير مصرّح" }, { status: 401 });

  // CSRF defence for this non-Server-Action endpoint: require same-origin requests.
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return Response.json({ error: "طلب غير مسموح" }, { status: 403 });

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_UPLOAD_BYTES + 64 * 1024) return Response.json({ error: "حجم الصورة أكبر من 8 ميغابايت" }, { status: 413 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") ?? "products");
    if (!(file instanceof File)) throw new DomainError("لم يتم اختيار صورة");
    const stored = await storeImage(file, ["products", "categories", "hero", "collections"].includes(folder) ? folder : "products");
    await audit({ actorId: user.id, action: "image.upload", entity: "Image", entityId: stored.key });
    return Response.json(stored);
  } catch (e) {
    const message = e instanceof DomainError ? e.message : "تعذّر رفع الصورة";
    if (!(e instanceof DomainError)) console.error(e);
    return Response.json({ error: message }, { status: 400 });
  }
}
