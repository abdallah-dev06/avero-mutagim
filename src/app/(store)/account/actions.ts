"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, requestMeta } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { burnPasswordCheck, hashPassword, verifyPassword } from "@/lib/password";
import { normalizePhone } from "@/lib/phone";
import { isLoginBlocked, recordLoginAttempt } from "@/lib/rate-limit";
import { ensureShopper } from "@/lib/shopper";
import { loginSchema, registerSchema } from "@/lib/validation";
import { isUniqueViolation } from "@/server/errors";

export type AuthState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

/** Attach the device's guest cart/wishlist to the account and merge carts from the user's other devices. */
async function adoptShopper(userId: string) {
  const current = await ensureShopper();
  await prisma.shopper.update({ where: { id: current.id }, data: { userId } });
  const others = await prisma.shopper.findMany({ where: { userId, id: { not: current.id } }, include: { cartItems: { include: { variant: true } }, wishlist: true } });
  for (const o of others) {
    for (const item of o.cartItems) {
      const existing = await prisma.cartItem.findUnique({ where: { shopperId_variantId: { shopperId: current.id, variantId: item.variantId } } });
      const qty = Math.min(item.variant.stock, (existing?.quantity ?? 0) + item.quantity, 20);
      if (qty > 0) {
        await prisma.cartItem.upsert({
          where: { shopperId_variantId: { shopperId: current.id, variantId: item.variantId } },
          create: { shopperId: current.id, variantId: item.variantId, quantity: qty },
          update: { quantity: qty },
        });
      }
    }
    for (const w of o.wishlist) {
      await prisma.wishlistItem.upsert({ where: { shopperId_productId: { shopperId: current.id, productId: w.productId } }, create: { shopperId: current.id, productId: w.productId }, update: {} });
    }
    await prisma.cartItem.deleteMany({ where: { shopperId: o.id } });
  }
}

export async function customerLogin(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "يرجى إدخال البريد وكلمة المرور" };
  const { email, password } = parsed.data;
  const { ip } = await requestMeta();
  if (await isLoginBlocked(ip, email)) return { error: "محاولات كثيرة. حاولي بعد 15 دقيقة." };
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user && user.isActive ? await verifyPassword(user.passwordHash, password) : (await burnPasswordCheck(password), false);
  await recordLoginAttempt(ip, email, !!ok);
  if (!ok || !user) return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  await createSession(user.id, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await adoptShopper(user.id);
  revalidatePath("/", "layout");
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/admin") ? next : "/account");
}

export async function customerRegister(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "يرجى مراجعة الحقول", fieldErrors };
  }
  const { ip } = await requestMeta();
  if (await isLoginBlocked(ip, parsed.data.email)) return { error: "محاولات كثيرة. حاولي لاحقاً." };
  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ? normalizePhone(parsed.data.phone) : null,
        passwordHash: await hashPassword(parsed.data.password),
        role: "CUSTOMER",
      },
    });
    await createSession(user.id, user.role);
    await adoptShopper(user.id);
  } catch (e) {
    if (isUniqueViolation(e)) return { error: "هذا البريد مسجّل مسبقاً — سجّلي الدخول بدلاً من ذلك", fieldErrors: { email: "البريد مستخدم" } };
    throw e;
  }
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function customerLogout() {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}
