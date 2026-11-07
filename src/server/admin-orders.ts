import "server-only";
import type { OrderStatus, PaymentStatus, Prisma } from "@/generated/prisma/client";
import { ALL_STATUSES } from "@/lib/order-status";
import { localDateString, localDayStart } from "@/server/dashboard";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const isDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function orderFilters(sp: SP) {
  const status = one(sp.status);
  const payment = one(sp.payment);
  const range = one(sp.range);
  return {
    q: one(sp.q)?.slice(0, 80),
    status: ALL_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined,
    payment: ["UNPAID", "PAID", "REFUNDED"].includes(payment ?? "") ? (payment as PaymentStatus) : undefined,
    city: one(sp.city),
    from: range === "today" ? localDateString(new Date()) : isDate(one(sp.from)) ? one(sp.from) : undefined,
    to: isDate(one(sp.to)) ? one(sp.to) : undefined,
    source: one(sp.source),
    page: Math.max(1, Number(one(sp.page)) || 1),
  };
}

export function orderWhere(f: ReturnType<typeof orderFilters>): Prisma.OrderWhereInput {
  const and: Prisma.OrderWhereInput[] = [];
  if (f.q) {
    const digits = f.q.replace(/\D/g, "");
    and.push({
      OR: [
        { reference: { contains: f.q.toUpperCase() } },
        { customerName: { contains: f.q, mode: "insensitive" } },
        ...(digits.length >= 4 ? [{ phone: { contains: digits.replace(/^0/, "") } }] : []),
        { addressLine: { contains: f.q, mode: "insensitive" } },
      ],
    });
  }
  if (f.status) and.push({ status: f.status });
  if (f.payment) and.push({ paymentStatus: f.payment });
  if (f.city) and.push({ cityName: f.city });
  if (f.source && ["WEBSITE", "MANUAL", "WHATSAPP", "INSTAGRAM"].includes(f.source)) and.push({ source: f.source as never });
  if (f.from) and.push({ createdAt: { gte: localDayStart(f.from) } });
  if (f.to) and.push({ createdAt: { lt: new Date(localDayStart(f.to).getTime() + 864e5) } });
  return and.length ? { AND: and } : {};
}

export function csvEscape(v: unknown) {
  let s = v == null ? "" : String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
