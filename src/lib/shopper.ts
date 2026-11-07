import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/crypto";
import { getCurrentUser } from "@/lib/auth";

export const SHOPPER_COOKIE = "vb_shopper";

/** Read-only lookup — safe inside Server Components. */
export async function findShopper() {
  const token = (await cookies()).get(SHOPPER_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  return prisma.shopper.findUnique({ where: { tokenHash: sha256(token) } });
}

/** Get or create — only call from Server Actions / Route Handlers (sets a cookie). */
export async function ensureShopper() {
  const existing = await findShopper();
  const user = await getCurrentUser();
  if (existing) {
    if (user && !existing.userId) await prisma.shopper.update({ where: { id: existing.id }, data: { userId: user.id } });
    return existing;
  }
  const token = randomToken(32);
  const shopper = await prisma.shopper.create({ data: { tokenHash: sha256(token), userId: user?.id ?? null } });
  (await cookies()).set(SHOPPER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return shopper;
}
