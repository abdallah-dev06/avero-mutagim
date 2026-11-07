import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/crypto";
import type { Role } from "@/generated/prisma/client";

export const SESSION_COOKIE = "vb_session";
const SESSION_DAYS = 14;
const ADMIN_SESSION_HOURS = 12;

export type SessionUser = { id: string; name: string; email: string; role: Role };

export async function requestMeta() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  return { ip, userAgent: h.get("user-agent")?.slice(0, 300) ?? null };
}

export async function createSession(userId: string, role: Role) {
  const token = randomToken(32);
  const ttlMs = role === "CUSTOMER" ? SESSION_DAYS * 864e5 : ADMIN_SESSION_HOURS * 36e5;
  const expiresAt = new Date(Date.now() + ttlMs);
  const meta = await requestMeta();
  await prisma.session.create({
    data: { id: sha256(token), userId, expiresAt, ip: meta.ip, userAgent: meta.userAgent },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

/** Current user for this request (deduped per request). Never throws. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const session = await prisma.session.findUnique({
    where: { id: sha256(token) },
    include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
  const { isActive: _ignored, ...user } = session.user;
  return user;
});

export function isStaff(user: SessionUser | null): user is SessionUser {
  return !!user && (user.role === "ADMIN" || user.role === "STAFF");
}

/** For admin pages: redirects to the admin login. */
export async function requireAdminPage() {
  const user = await getCurrentUser();
  if (!isStaff(user)) redirect("/admin/login");
  return user;
}

export class AuthError extends Error {
  constructor(message = "غير مصرّح") {
    super(message);
  }
}

/** For server actions / route handlers: throws if not staff (or not ADMIN when required). */
export async function requireStaff(opts: { adminOnly?: boolean } = {}) {
  const user = await getCurrentUser();
  if (!isStaff(user)) throw new AuthError();
  if (opts.adminOnly && user.role !== "ADMIN") throw new AuthError("هذه العملية متاحة للمدير فقط");
  return user;
}
