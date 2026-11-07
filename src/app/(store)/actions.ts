"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, requestMeta } from "@/lib/auth";
import { ensureShopper, findShopper } from "@/lib/shopper";
import { getSettings } from "@/lib/settings";
import { normalizePhone } from "@/lib/phone";
import { hitLimit } from "@/lib/rate-limit";
import { checkoutSchema, trackSchema } from "@/lib/validation";
import { createOrder, MAX_QTY_PER_LINE } from "@/server/orders";
import { DomainError, publicMessage, StockError } from "@/server/errors";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; fieldErrors?: Record<string, string> };

const RECENT_ORDERS_COOKIE = "vb_recent_orders";

function refresh() {
  revalidatePath("/", "layout");
}

export async function addToCart(variantId: string, quantity: number): Promise<Result<{ count: number }>> {
  try {
    if (typeof variantId !== "string" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) {
      throw new DomainError("كمية غير صالحة");
    }
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, include: { product: { select: { status: true } } } });
    if (!variant || !variant.isActive || variant.product.status !== "PUBLISHED") throw new DomainError("هذا الخيار غير متاح");
    const shopper = await ensureShopper();
    const existing = await prisma.cartItem.findUnique({ where: { shopperId_variantId: { shopperId: shopper.id, variantId } } });
    const nextQty = (existing?.quantity ?? 0) + quantity;
    if (variant.stock <= 0) throw new DomainError("عذراً، نفدت الكمية من هذا المقاس");
    if (nextQty > variant.stock) throw new DomainError(`المتوفر من هذا المقاس ${variant.stock} فقط${existing ? " وهو موجود في سلتك" : ""}`);
    if (nextQty > MAX_QTY_PER_LINE) throw new DomainError(`الحد الأقصى ${MAX_QTY_PER_LINE} قطعة`);
    await prisma.cartItem.upsert({
      where: { shopperId_variantId: { shopperId: shopper.id, variantId } },
      create: { shopperId: shopper.id, variantId, quantity },
      update: { quantity: nextQty },
    });
    const agg = await prisma.cartItem.aggregate({ where: { shopperId: shopper.id }, _sum: { quantity: true } });
    refresh();
    return { ok: true, count: agg._sum.quantity ?? 0 };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Result> {
  try {
    const shopper = await findShopper();
    if (!shopper) throw new DomainError("السلة غير موجودة");
    const item = await prisma.cartItem.findFirst({ where: { id: itemId, shopperId: shopper.id }, include: { variant: true } });
    if (!item) throw new DomainError("العنصر غير موجود في السلة");
    if (!Number.isInteger(quantity) || quantity < 0) throw new DomainError("كمية غير صالحة");
    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      if (quantity > item.variant.stock) throw new DomainError(`المتوفر ${item.variant.stock} فقط`);
      if (quantity > MAX_QTY_PER_LINE) throw new DomainError(`الحد الأقصى ${MAX_QTY_PER_LINE} قطعة`);
      await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

export async function removeCartItem(itemId: string): Promise<Result> {
  return updateCartItem(itemId, 0);
}

export async function toggleWishlist(productId: string): Promise<Result<{ wished: boolean }>> {
  try {
    const product = await prisma.product.findFirst({ where: { id: productId, status: "PUBLISHED" }, select: { id: true } });
    if (!product) throw new DomainError("المنتج غير متاح");
    const shopper = await ensureShopper();
    const existing = await prisma.wishlistItem.findUnique({ where: { shopperId_productId: { shopperId: shopper.id, productId } } });
    if (existing) await prisma.wishlistItem.delete({ where: { id: existing.id } });
    else await prisma.wishlistItem.create({ data: { shopperId: shopper.id, productId } });
    refresh();
    return { ok: true, wished: !existing };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

export async function getAreas(cityId: string) {
  if (typeof cityId !== "string" || cityId.length > 40) return [];
  return prisma.area.findMany({ where: { cityId, isActive: true, city: { isActive: true } }, orderBy: { sortOrder: "asc" }, select: { name: true } });
}

async function rememberOrder(reference: string, token: string) {
  const jar = await cookies();
  let list: [string, string][] = [];
  try {
    list = JSON.parse(jar.get(RECENT_ORDERS_COOKIE)?.value ?? "[]");
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }
  list = [[reference, token] as [string, string], ...list.filter(([r]) => r !== reference)].slice(0, 5);
  jar.set(RECENT_ORDERS_COOKIE, JSON.stringify(list), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

async function recalledToken(reference: string) {
  try {
    const list = JSON.parse((await cookies()).get(RECENT_ORDERS_COOKIE)?.value ?? "[]") as [string, string][];
    return list.find(([r]) => r === reference)?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function placeOrder(raw: unknown): Promise<Result<{ redirectTo: string }>> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "يرجى مراجعة الحقول المطلوبة", fieldErrors };
  }
  const data = parsed.data;
  try {
    const { ip } = await requestMeta();
    if (await hitLimit(`checkout:${ip}`, 12, 10 * 60 * 1000)) throw new DomainError("محاولات كثيرة، يرجى الانتظار قليلاً ثم المحاولة");

    const shopper = await findShopper();
    if (!shopper) throw new DomainError("سلتك فارغة");
    const items = await prisma.cartItem.findMany({ where: { shopperId: shopper.id }, select: { variantId: true, quantity: true } });

    // An idempotent retry after success: the cart is already empty, return the existing order.
    const already = await prisma.order.findUnique({ where: { idempotencyKey: data.idempotencyKey }, select: { reference: true } });
    if (!items.length && !already) throw new DomainError("سلتك فارغة");

    const area = await prisma.area.findFirst({ where: { cityId: data.cityId, name: data.areaName, isActive: true } });
    if (!area && !already) return { ok: false, error: "يرجى اختيار المنطقة", fieldErrors: { areaName: "اختاري منطقة من القائمة" } };

    const settings = await getSettings();
    const user = await getCurrentUser();
    const result = await createOrder(prisma, {
      lines: items,
      customer: {
        customerName: data.customerName,
        phone: normalizePhone(data.phone)!,
        cityId: data.cityId,
        areaName: data.areaName,
        addressLine: data.addressLine,
        note: data.note || null,
      },
      shippingFee: settings.shipping.fee,
      idempotencyKey: data.idempotencyKey,
      customerId: user?.role === "CUSTOMER" ? user.id : null,
      source: "WEBSITE",
    });

    if (!result.duplicate) {
      if (data.whatsappOptIn) await prisma.order.update({ where: { id: result.orderId }, data: { whatsappOptIn: true } });
      await prisma.cartItem.deleteMany({ where: { shopperId: shopper.id } });
      await rememberOrder(result.reference, result.accessToken!);
      refresh();
      revalidatePath("/admin", "layout");
    }
    const token = result.accessToken ?? (await recalledToken(result.reference));
    const redirectTo = token ? `/order/${result.reference}?t=${encodeURIComponent(token)}&new=1` : `/track?ref=${result.reference}`;
    return { ok: true, redirectTo };
  } catch (e) {
    if (e instanceof StockError) {
      refresh();
      return { ok: false, error: `${e.message}. تم تحديث السلة، يرجى مراجعتها.` };
    }
    return { ok: false, error: publicMessage(e, "تعذّر إتمام الطلب، يرجى المحاولة مرة أخرى") };
  }
}

export async function trackOrder(raw: unknown): Promise<Result<{ redirectTo: string }>> {
  const parsed = trackSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  const { ip } = await requestMeta();
  if (await hitLimit(`track:${ip}`, 20, 15 * 60 * 1000)) return { ok: false, error: "محاولات كثيرة، حاولي لاحقاً" };
  const phone = normalizePhone(parsed.data.phone);
  const order = await prisma.order.findUnique({ where: { reference: parsed.data.reference }, select: { phone: true, accessToken: true } });
  if (!order || order.phone !== phone) return { ok: false, error: "لم نجد طلباً بهذا الرقم ورقم الهاتف" };
  await rememberOrder(parsed.data.reference, order.accessToken);
  return { ok: true, redirectTo: `/order/${parsed.data.reference}?t=${encodeURIComponent(order.accessToken)}` };
}
