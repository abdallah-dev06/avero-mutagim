import { audit } from "@/lib/audit";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, storeImage } from "@/lib/storage";
import { DomainError } from "@/server/errors";

const ALLOWED_FOLDERS = new Set(["products", "categories", "hero", "collections", "story", "announcement", "reviews", "brand"]);

/** Authenticated, same-origin image upload. Validates size/type/content and re-encodes to WebP. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!isStaff(user)) {
    return Response.json({ error: "غير مصرّح بالدخول. يرجى تسجيل الدخول كمسؤول." }, { status: 401 });
  }

  // Same-origin verification with proxy support (Vercel, Cloudflare, Localhost)
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const hostHeader = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim().toLowerCase();

  const sourceHost = (() => {
    try {
      if (origin) return new URL(origin).host.toLowerCase();
      if (referer) return new URL(referer).host.toLowerCase();
    } catch {
      return null;
    }
    return null;
  })();

  if (sourceHost && hostHeader && sourceHost !== hostHeader && !sourceHost.endsWith(".vercel.app")) {
    return Response.json({ error: "طلب غير مسموح (CSRF)" }, { status: 403 });
  }

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_UPLOAD_BYTES + 256 * 1024) {
    return Response.json({ error: "حجم الصورة أكبر من 12 ميغابايت" }, { status: 413 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const rawFolder = String(form.get("folder") ?? "products");
    const folder = ALLOWED_FOLDERS.has(rawFolder) ? rawFolder : "products";

    if (!(file instanceof File) || file.size === 0) {
      throw new DomainError("لم يتم اختيار صورة صالحة للرفع");
    }

    const stored = await storeImage(file, folder);
    await audit({ actorId: user.id, action: "image.upload", entity: "Image", entityId: stored.key });
    return Response.json(stored);
  } catch (e) {
    const message = e instanceof DomainError ? e.message : "تعذّر معالجة الصورة ورفعها";
    if (!(e instanceof DomainError)) console.error("Upload error:", e);
    return Response.json({ error: message }, { status: 400 });
  }
}
