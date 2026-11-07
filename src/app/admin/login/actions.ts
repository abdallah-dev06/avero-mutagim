"use server";

import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { createSession, destroySession, getCurrentUser, requestMeta } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { burnPasswordCheck, verifyPassword } from "@/lib/password";
import { normalizePhone } from "@/lib/phone";
import { isLoginBlocked, recordLoginAttempt } from "@/lib/rate-limit";

export type AdminLoginState = { error?: string } | undefined;

export async function adminLogin(_: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const raw = String(formData.get("identifier") || formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (!raw || !password) {
    return { error: "يرجى إدخال الرقم أو البريد الإلكتروني وكلمة المرور" };
  }

  const { ip } = await requestMeta();

  if (await isLoginBlocked(ip, raw)) {
    await audit({ action: "admin.login.blocked", entity: "User", entityId: raw, ip });
    return { error: "تم إيقاف المحاولات مؤقتاً بسبب كثرة المحاولات الفاشلة. يرجى المحاولة بعد 15 دقيقة." };
  }

  const normalized = normalizePhone(raw);
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: raw.toLowerCase() },
        ...(normalized ? [{ phone: normalized }] : []),
        { phone: raw },
      ],
    },
  });

  const staff = user && user.isActive && (user.role === "ADMIN" || user.role === "STAFF");
  const ok = staff ? await verifyPassword(user.passwordHash, password) : (await burnPasswordCheck(password), false);
  await recordLoginAttempt(ip, raw, !!ok);

  if (!ok || !user) {
    await audit({ action: "admin.login.failed", entity: "User", entityId: raw, ip });
    return { error: "بيانات الدخول غير صحيحة" };
  }

  await createSession(user.id, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit({ actorId: user.id, action: "admin.login", entity: "User", entityId: user.id, ip });
  redirect("/admin");
}

export async function adminLogout() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await audit({ actorId: user.id, action: "admin.logout", entity: "User", entityId: user.id });
  redirect("/admin/login");
}
