import "server-only";
import { prisma } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_IP = 10;
const MAX_FAILURES_PER_EMAIL = 5;

export async function isLoginBlocked(ip: string, email: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const [byIp, byEmail] = await Promise.all([
    prisma.loginAttempt.count({ where: { key: `ip:${ip}`, success: false, createdAt: { gte: since } } }),
    prisma.loginAttempt.count({ where: { key: `email:${email}`, success: false, createdAt: { gte: since } } }),
  ]);
  return byIp >= MAX_FAILURES_PER_IP || byEmail >= MAX_FAILURES_PER_EMAIL;
}

export async function recordLoginAttempt(ip: string, email: string, success: boolean) {
  await prisma.loginAttempt.createMany({
    data: [
      { key: `ip:${ip}`, success },
      { key: `email:${email}`, success },
    ],
  });
  if (success) {
    await prisma.loginAttempt.deleteMany({ where: { key: `email:${email}`, success: false } });
  }
}

/** Generic sliding-window limiter backed by the same table (e.g. checkout spam). */
export async function hitLimit(key: string, max: number, windowMs: number) {
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.loginAttempt.count({ where: { key, createdAt: { gte: since } } });
  if (count >= max) return true;
  await prisma.loginAttempt.create({ data: { key, success: true } });
  return false;
}
